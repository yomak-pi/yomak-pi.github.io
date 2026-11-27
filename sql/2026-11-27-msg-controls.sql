-- Messenger-style message controls. Additive only.
alter table public.dm_messages add column if not exists unsent_at timestamptz;
alter table public.dm_messages add column if not exists forwarded boolean not null default false;
alter table public.dm_messages add column if not exists pinned_at timestamptz;
alter table public.dm_messages add column if not exists pinned_by uuid;
alter table public.dm_messages add column if not exists expires_at timestamptz;
alter table public.dm_messages add column if not exists edit_count int not null default 0;
alter table public.messages add column if not exists unsent_at timestamptz;
alter table public.messages add column if not exists forwarded boolean not null default false;
alter table public.messages add column if not exists pinned_at timestamptz;
alter table public.messages add column if not exists pinned_by uuid;
alter table public.messages add column if not exists edited_at timestamptz;
alter table public.messages add column if not exists edit_count int not null default 0;
alter table public.dm_chats add column if not exists disappear_secs int;
alter table public.chat_prefs add column if not exists cleared_upto bigint not null default 0;
alter table public.chat_prefs add column if not exists accepted boolean not null default false;

create table if not exists public.user_blocks (
  blocker uuid not null default auth.uid() references auth.users(id) on delete cascade,
  blocked uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked),
  check (blocker <> blocked)
);
alter table public.user_blocks enable row level security;
drop policy if exists ub_read on public.user_blocks;
drop policy if exists ub_ins on public.user_blocks;
drop policy if exists ub_del on public.user_blocks;
create policy ub_read on public.user_blocks for select to authenticated using (blocker = auth.uid());
create policy ub_ins on public.user_blocks for insert to authenticated with check (blocker = auth.uid());
create policy ub_del on public.user_blocks for delete to authenticated using (blocker = auth.uid());

create or replace function public.dm_blocked(chat uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.dm_chats c join public.user_blocks b
    on (b.blocker = c.user_a and b.blocked = c.user_b) or (b.blocker = c.user_b and b.blocked = c.user_a)
    where c.id = chat)
$$;
drop policy if exists "no dm when blocked" on public.dm_messages;
create policy "no dm when blocked" on public.dm_messages as restrictive for insert to authenticated with check (not public.dm_blocked(chat_id));

create or replace function public.dm_expire_set() returns trigger
language plpgsql security definer set search_path = public as $$
declare s int;
begin
  if coalesce(new.kind,'text') <> 'system' then
    select disappear_secs into s from public.dm_chats where id = new.chat_id;
    if s is not null and s > 0 then new.expires_at := now() + make_interval(secs => s); end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_dm_expire on public.dm_messages;
create trigger trg_dm_expire before insert on public.dm_messages for each row execute function public.dm_expire_set();

create or replace function public.msg_unsend(k text, mid bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  if k = 'd' then
    update public.dm_messages set unsent_at = now(), body = '·', kind = 'text', media_url = null, media_secs = null, pinned_at = null, pinned_by = null
      where id = mid and user_id = auth.uid() and unsent_at is null;
  elsif k = 'g' then
    update public.messages set unsent_at = now(), body = '·', kind = 'text', media_url = null, media_secs = null, pinned_at = null, pinned_by = null
      where id = mid and user_id = auth.uid() and unsent_at is null;
  end if;
end $$;

create or replace function public.msg_edit(k text, mid bigint, txt text) returns void
language plpgsql security definer set search_path = public as $$
declare ok int;
begin
  txt := left(btrim(coalesce(txt,'')), 1000);
  if char_length(txt) < 1 then raise exception 'empty'; end if;
  if k = 'd' then
    update public.dm_messages set body = txt, edited_at = now(), edit_count = edit_count + 1
      where id = mid and user_id = auth.uid() and unsent_at is null and coalesce(kind,'text') = 'text' and created_at > now() - interval '15 minutes' and edit_count < 5;
  else
    update public.messages set body = txt, edited_at = now(), edit_count = edit_count + 1
      where id = mid and user_id = auth.uid() and unsent_at is null and coalesce(kind,'text') = 'text' and created_at > now() - interval '15 minutes' and edit_count < 5;
  end if;
  get diagnostics ok = row_count;
  if ok = 0 then raise exception 'edit window closed'; end if;
end $$;

create or replace function public.msg_pin(k text, mid bigint, flag boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if k = 'd' then
    update public.dm_messages m set pinned_at = case when flag then now() end, pinned_by = case when flag then auth.uid() end
      where m.id = mid and m.unsent_at is null and public.is_dm_member(m.chat_id::text, auth.uid());
  else
    update public.messages m set pinned_at = case when flag then now() end, pinned_by = case when flag then auth.uid() end
      where m.id = mid and m.unsent_at is null and exists (select 1 from public.group_members gm where gm.group_id = m.group_id and gm.user_id = auth.uid());
  end if;
end $$;

create or replace function public.dm_set_disappear(chat uuid, secs int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_dm_member(chat::text, auth.uid()) then raise exception 'not a member'; end if;
  if secs is not null and secs <= 0 then secs := null; end if;
  update public.dm_chats set disappear_secs = secs where id = chat;
  insert into public.dm_messages (chat_id, user_id, body, kind) values (chat, auth.uid(), 'disappear:' || coalesce(secs::text,'0'), 'system');
end $$;

grant execute on function public.msg_unsend(text,bigint), public.msg_edit(text,bigint,text), public.msg_pin(text,bigint,boolean), public.dm_set_disappear(uuid,int) to authenticated;

do $$ begin
  perform cron.unschedule('dm-expire');
exception when others then null;
end $$;
select cron.schedule('dm-expire', '*/5 * * * *', $c$delete from public.dm_messages where expires_at is not null and expires_at < now()$c$);
do $$ begin
  begin alter publication supabase_realtime add table public.user_blocks; exception when others then null; end;
end $$;
