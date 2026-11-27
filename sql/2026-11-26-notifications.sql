-- Phase 4C: notifications center + push. New table, new functions, new triggers only.
create table if not exists public.notifications (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  kind text not null,
  ref_id text,
  text text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
alter table public.notifications enable row level security;
create policy "notif select own" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "notif update own" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notif delete own" on public.notifications for delete to authenticated using (user_id = auth.uid());
-- no insert policy: only the trigger functions below can create notifications

create or replace function public.push_user(rcpt uuid, ttl text, body text, tg text) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare u text; s text;
begin
  begin
    select value into u from public.push_config where key = 'url';
    select value into s from public.push_config where key = 'secret';
    if u is null or s is null then return; end if;
    perform net.http_post(url := u,
      headers := jsonb_build_object('Content-Type','application/json','x-push-secret', s),
      body := jsonb_build_object('mode','notify','user_id', rcpt, 'title', left(coalesce(ttl,'يومك'),60), 'body', left(coalesce(body,''),120), 'tag', left(coalesce(tg,'n'),40)));
  exception when others then null;
  end;
end $$;

create or replace function public.notify_user(rcpt uuid, actor uuid, k text, ref text, txt text, mute_key text default null) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare nm text;
begin
  if rcpt is null or rcpt = actor then return; end if;
  if mute_key is not null and exists (select 1 from public.chat_prefs p where p.user_id = rcpt and p.chat_key = mute_key and p.muted) then return; end if;
  if exists (select 1 from public.notifications n where n.user_id = rcpt and n.actor_id is not distinct from actor and n.kind = k and n.ref_id is not distinct from ref and not n.read) then return; end if;
  insert into public.notifications (user_id, actor_id, kind, ref_id, text) values (rcpt, actor, k, ref, txt);
  select name into nm from public.profiles where id = actor;
  perform public.push_user(rcpt, coalesce(nm,'يومك'), txt, k || ':' || coalesce(ref,''));
end $$;

create or replace function public.notify_mentions(body text, actor uuid, k text, ref text, label text) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare m text[]; rcpt uuid;
begin
  for m in select regexp_matches(coalesce(body,''), '@([A-Za-z0-9_]{2,30})', 'g') loop
    select id into rcpt from public.profiles where lower(username) = lower(m[1]) limit 1;
    if rcpt is not null then perform public.notify_user(rcpt, actor, 'mention', ref, label); end if;
  end loop;
end $$;

create or replace function public.trg_n_reaction() returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  begin
  select user_id into owner from public.service_posts where id = new.post_id;
  perform public.notify_user(owner, new.user_id, 'reaction', new.post_id::text,
    case new.kind when 'love' then 'أحبّ ❤️ منشورك' when 'haha' then 'أضحكه 😂 منشورك' when 'wow' then 'تفاجأ 😮 بمنشورك' when 'sad' then 'حزن 😢 على منشورك' when 'angry' then 'غضب 😡 من منشورك' else 'أعجبه 👍 منشورك' end);
  exception when others then null;
  end;
  return new;
end $$;
drop trigger if exists n_reaction on public.post_reactions;
create trigger n_reaction after insert on public.post_reactions for each row execute function public.trg_n_reaction();

create or replace function public.trg_n_comment() returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid; par uuid;
begin
  begin
  select user_id into owner from public.service_posts where id = new.post_id;
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
drop trigger if exists n_comment on public.post_comments;
create trigger n_comment after insert on public.post_comments for each row execute function public.trg_n_comment();

create or replace function public.trg_n_comment_like() returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid; pid uuid;
begin
  begin
  select user_id, post_id into owner, pid from public.post_comments where id = new.comment_id;
  perform public.notify_user(owner, new.user_id, 'comment_like', pid::text, 'أعجبه ❤️ تعليقك');
  exception when others then null;
  end;
  return new;
end $$;
drop trigger if exists n_comment_like on public.comment_likes;
create trigger n_comment_like after insert on public.comment_likes for each row execute function public.trg_n_comment_like();

create or replace function public.trg_n_follow() returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
  perform public.notify_user(new.following, new.follower, 'follow', new.follower::text, 'بدأ متابعتك');
  exception when others then null;
  end;
  return new;
end $$;
drop trigger if exists n_follow on public.follows;
create trigger n_follow after insert on public.follows for each row execute function public.trg_n_follow();

create or replace function public.trg_n_post_mention() returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
  perform public.notify_mentions(new.body, new.user_id, 'mention', new.id::text, 'ذكرك في منشور: ' || left(coalesce(new.body,''), 60));
  exception when others then null;
  end;
  return new;
end $$;
drop trigger if exists n_post_mention on public.service_posts;
create trigger n_post_mention after insert on public.service_posts for each row execute function public.trg_n_post_mention();

create or replace function public.trg_n_group_post() returns trigger language plpgsql security definer set search_path = public as $$
declare gname text; r record;
begin
  begin
  select name into gname from public.groups where id = new.group_id;
  for r in select user_id from public.group_members where group_id = new.group_id and user_id <> new.user_id limit 300 loop
    perform public.notify_user(r.user_id, new.user_id, 'group_post', new.group_id::text, 'منشور جديد في ' || coalesce(gname,'الجروب') || ': ' || left(coalesce(new.body,''), 50), 'g:' || new.group_id::text);
  end loop;
  perform public.notify_mentions(new.body, new.user_id, 'mention', new.group_id::text, 'ذكرك في ' || coalesce(gname,'جروب'));
  exception when others then null;
  end;
  return new;
end $$;
drop trigger if exists n_group_post on public.posts;
create trigger n_group_post after insert on public.posts for each row execute function public.trg_n_group_post();

-- group chat messages: push only (not stored), respects mute
create or replace function public.trg_n_group_msg() returns trigger language plpgsql security definer set search_path = public, extensions as $$
declare gname text; nm text; r record;
begin
  begin
    select name into gname from public.groups where id = new.group_id;
    select name into nm from public.profiles where id = new.user_id;
    for r in select user_id from public.group_members where group_id = new.group_id and user_id <> new.user_id limit 300 loop
      if not exists (select 1 from public.chat_prefs p where p.user_id = r.user_id and p.chat_key = 'g:' || new.group_id::text and p.muted) then
        perform public.push_user(r.user_id, coalesce(gname,'جروب'), coalesce(nm,'') || ': ' || left(coalesce(new.body,''), 80), 'gm:' || new.group_id::text);
      end if;
    end loop;
  exception when others then null;
  end;
  return new;
end $$;
drop trigger if exists n_group_msg on public.messages;
create trigger n_group_msg after insert on public.messages for each row execute function public.trg_n_group_msg();

create or replace function public.trg_n_svc_request() returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  begin
  select user_id into owner from public.service_providers where id = new.provider_id;
  perform public.notify_user(owner, new.user_id, 'service_request', new.provider_id::text, 'طلب خدمة جديد: ' || left(new.details, 60));
  exception when others then null;
  end;
  return new;
end $$;
drop trigger if exists n_svc_request on public.service_requests;
create trigger n_svc_request after insert on public.service_requests for each row execute function public.trg_n_svc_request();

create or replace function public.trg_n_join_request() returns trigger language plpgsql security definer set search_path = public as $$
declare gname text; r record;
begin
  begin
  select name into gname from public.groups where id = new.group_id;
  for r in select owner as user_id from public.groups where id = new.group_id union select user_id from public.group_admins where group_id = new.group_id loop
    perform public.notify_user(r.user_id, new.user_id, 'join_request', new.group_id::text, 'طلب انضمام جديد إلى ' || coalesce(gname,'الجروب'));
  end loop;
  exception when others then null;
  end;
  return new;
end $$;
drop trigger if exists n_join_request on public.group_join_requests;
create trigger n_join_request after insert on public.group_join_requests for each row execute function public.trg_n_join_request();

-- DM push keeps working through notify_dm (mute-aware). Realtime for the bell:
do $$ begin
  begin alter publication supabase_realtime add table public.notifications; exception when others then null; end;
end $$;
