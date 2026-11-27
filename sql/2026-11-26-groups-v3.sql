-- Phase 4D1: group types (public/private/hidden), moderator role, rules, post approval, pinned posts,
-- group bans/mutes, public group posts visible to everyone, comments on group posts.
-- Adds columns/tables/policies. Restrictive policies below only narrow: pending posts, hidden groups.

alter table public.group_settings drop constraint if exists group_settings_privacy_check;
alter table public.group_settings add constraint group_settings_privacy_check check (privacy in ('public','private','hidden'));
alter table public.group_settings add column if not exists rules text check (rules is null or char_length(rules) <= 1500);
alter table public.group_settings add column if not exists post_approval boolean not null default false;
alter table public.group_admins add column if not exists role text not null default 'admin' check (role in ('admin','moderator'));
alter table public.posts add column if not exists status text not null default 'published' check (status in ('published','pending'));
alter table public.posts add column if not exists pinned boolean not null default false;

-- admin = owner or role admin; moderator = admin or role moderator
create or replace function public.is_group_admin(gid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.owns_group(gid)
      or exists (select 1 from public.group_admins ga where ga.group_id = gid and ga.user_id = auth.uid() and ga.role = 'admin');
$$;
create or replace function public.is_group_mod(gid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.owns_group(gid)
      or exists (select 1 from public.group_admins ga where ga.group_id = gid and ga.user_id = auth.uid());
$$;
create or replace function public.group_is_closed(gid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.group_settings s where s.group_id = gid and s.privacy in ('private','hidden'));
$$;
create or replace function public.group_is_hidden(gid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.group_settings s where s.group_id = gid and s.privacy = 'hidden');
$$;
grant execute on function public.is_group_mod(uuid), public.group_is_closed(uuid), public.group_is_hidden(uuid) to authenticated, anon;

-- the group owner can set the group's type when creating or editing it (also for hidden)
-- bans and mutes
create table if not exists public.group_bans (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'ban' check (kind in ('ban','mute')),
  until timestamptz,
  reason text check (reason is null or char_length(reason) <= 200),
  by_user uuid default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
alter table public.group_bans enable row level security;
create policy "gbans read" on public.group_bans for select to authenticated using (user_id = auth.uid() or public.is_group_mod(group_id) or public.is_admin());
create policy "gbans insert" on public.group_bans for insert to authenticated with check (public.is_group_admin(group_id) and user_id <> (select g.owner from public.groups g where g.id = group_id));
create policy "gbans update" on public.group_bans for update to authenticated using (public.is_group_admin(group_id)) with check (public.is_group_admin(group_id));
create policy "gbans delete" on public.group_bans for delete to authenticated using (public.is_group_admin(group_id) or public.is_admin());
create or replace function public.group_blocked(gid uuid, need_ban boolean default false) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.group_bans b where b.group_id = gid and b.user_id = auth.uid()
    and (b.until is null or b.until > now()) and (not need_ban or b.kind = 'ban'));
$$;
grant execute on function public.group_blocked(uuid, boolean) to authenticated;
create policy "no join when banned" on public.group_members as restrictive for insert with check (not public.group_blocked(group_id, true));
create policy "no post when blocked" on public.posts as restrictive for insert with check (not public.group_blocked(group_id));
create policy "no msg when blocked" on public.messages as restrictive for insert with check (not public.group_blocked(group_id));
create or replace function public.trg_ban_removes() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.kind = 'ban' then delete from public.group_members where group_id = new.group_id and user_id = new.user_id; end if;
  return new;
end $$;
drop trigger if exists ban_removes on public.group_bans;
create trigger ban_removes after insert or update on public.group_bans for each row execute function public.trg_ban_removes();

-- public group posts are visible to everyone; pending posts only to author and moderators
create policy "posts read public group" on public.posts for select to anon, authenticated using (not public.group_is_closed(group_id));
create policy "posts hide pending" on public.posts as restrictive for select
  using (status = 'published' or user_id = auth.uid() or public.is_group_mod(group_id) or public.is_admin());
-- hidden groups are invisible to non-members
create policy "hidden groups invisible" on public.groups as restrictive for select
  using (not public.group_is_hidden(id) or public.is_member(id) or public.owns_group(id) or public.is_admin() or public.has_approved_request(id));
create policy "closed members list" on public.group_members as restrictive for select
  using (not public.group_is_closed(group_id) or public.is_member(group_id) or user_id = auth.uid() or public.is_admin());

-- moderators can delete/pin/approve posts and delete chat messages
create policy "posts mod update" on public.posts for update to authenticated using (public.is_group_mod(group_id)) with check (public.is_group_mod(group_id));
create policy "posts mod delete" on public.posts for delete to authenticated using (public.is_group_mod(group_id));
create policy "msgs mod delete" on public.messages for delete to authenticated using (public.is_group_mod(group_id));
create or replace function public.trg_posts_guard() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if exists (select 1 from public.group_settings s where s.group_id = new.group_id and s.post_approval)
       and not public.is_group_mod(new.group_id) and not public.is_admin() then new.status := 'pending'; else new.status := 'published'; end if;
    new.pinned := false;
  else
    if auth.uid() is not null and auth.uid() is distinct from old.user_id and not public.is_admin() then
      new.body := old.body; new.group_id := old.group_id; new.user_id := old.user_id;
    else
      if not public.is_group_mod(old.group_id) then new.status := old.status; new.pinned := old.pinned; end if;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists posts_guard on public.posts;
create trigger posts_guard before insert or update on public.posts for each row execute function public.trg_posts_guard();

-- comments and reactions on GROUP posts: drop the service_posts-only foreign key, clean up by trigger instead
alter table public.post_comments drop constraint if exists post_comments_post_id_fkey;
create or replace function public.trg_post_cleanup() returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.post_comments where post_id = old.id;
  delete from public.post_reactions where post_id = old.id;
  return old;
end $$;
drop trigger if exists post_cleanup_sp on public.service_posts;
create trigger post_cleanup_sp after delete on public.service_posts for each row execute function public.trg_post_cleanup();
drop trigger if exists post_cleanup_gp on public.posts;
create trigger post_cleanup_gp after delete on public.posts for each row execute function public.trg_post_cleanup();
create policy "cmt delete group mod" on public.post_comments for delete to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id and public.is_group_mod(p.group_id)));

-- notifications: group posts also notify owners on reactions/comments; pending posts notify moderators
create or replace function public.post_owner(pid uuid) returns uuid language sql stable security definer set search_path = public as $$
  select coalesce((select user_id from public.service_posts where id = pid), (select user_id from public.posts where id = pid))
$$;
create or replace function public.trg_n_reaction() returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  begin
    owner := public.post_owner(new.post_id);
    perform public.notify_user(owner, new.user_id, 'reaction', new.post_id::text,
      case new.kind when 'love' then 'أحبّ ❤️ منشورك' when 'haha' then 'أضحكه 😂 منشورك' when 'wow' then 'تفاجأ 😮 بمنشورك' when 'sad' then 'حزن 😢 على منشورك' when 'angry' then 'غضب 😡 من منشورك' else 'أعجبه 👍 منشورك' end);
  exception when others then null;
  end;
  return new;
end $$;
create or replace function public.trg_n_comment() returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid; par uuid;
begin
  begin
    owner := public.post_owner(new.post_id);
    if new.parent_id is not null then
      select user_id into par from public.post_comments where id = new.parent_id;
      perform public.notify_user(par, new.user_id, 'reply', new.post_id::text, 'ردّ على تعليقك: ' || left(new.body, 60));
    end if;
    if owner is distinct from par then
      perform public.notify_user(owner, new.user_id, 'comment', new.post_id::text, 'علّق على منشورك: ' || left(new.body, 60));
    end if;
    perform public.notify_mentions(new.body, new.user_id, 'mention', new.post_id::text, 'ذكرك في تعليق: ' || left(new.body, 60));
  exception when others then null;
  end;
  return new;
end $$;
create or replace function public.trg_n_group_post() returns trigger language plpgsql security definer set search_path = public as $$
declare gname text; r record;
begin
  begin
    select name into gname from public.groups where id = new.group_id;
    if new.status = 'pending' then
      for r in select owner as user_id from public.groups where id = new.group_id union select user_id from public.group_admins where group_id = new.group_id loop
        perform public.notify_user(r.user_id, new.user_id, 'group_pending', new.group_id::text, 'منشور ينتظر موافقتك في ' || coalesce(gname,'الجروب'));
      end loop;
    else
      for r in select user_id from public.group_members where group_id = new.group_id and user_id <> new.user_id limit 300 loop
        perform public.notify_user(r.user_id, new.user_id, 'group_post', new.group_id::text, 'منشور جديد في ' || coalesce(gname,'الجروب') || ': ' || left(coalesce(new.body,''), 50), 'g:' || new.group_id::text);
      end loop;
      perform public.notify_mentions(new.body, new.user_id, 'mention', new.group_id::text, 'ذكرك في ' || coalesce(gname,'جروب'));
    end if;
  exception when others then null;
  end;
  return new;
end $$;
-- when a pending post is approved, tell the author and the members
create or replace function public.trg_n_group_approved() returns trigger language plpgsql security definer set search_path = public as $$
declare gname text; r record;
begin
  begin
    if old.status = 'pending' and new.status = 'published' then
      select name into gname from public.groups where id = new.group_id;
      perform public.notify_user(new.user_id, auth.uid(), 'group_approved', new.group_id::text, 'تمت الموافقة على منشورك في ' || coalesce(gname,'الجروب'));
      for r in select user_id from public.group_members where group_id = new.group_id and user_id <> new.user_id limit 300 loop
        perform public.notify_user(r.user_id, new.user_id, 'group_post', new.group_id::text, 'منشور جديد في ' || coalesce(gname,'الجروب') || ': ' || left(coalesce(new.body,''), 50), 'g:' || new.group_id::text);
      end loop;
    end if;
  exception when others then null;
  end;
  return new;
end $$;
drop trigger if exists n_group_approved on public.posts;
create trigger n_group_approved after update on public.posts for each row execute function public.trg_n_group_approved();

-- invite link preview: anyone holding the group id (unguessable) can see name/type, even for hidden groups
create or replace function public.group_preview(gid uuid) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('id', g.id, 'name', g.name, 'description', g.description,
    'privacy', coalesce((select s.privacy from public.group_settings s where s.group_id = g.id), 'public'),
    'members', (select count(*) from public.group_members m where m.group_id = g.id))
  from public.groups g where g.id = gid
$$;
grant execute on function public.group_preview(uuid) to anon, authenticated;
