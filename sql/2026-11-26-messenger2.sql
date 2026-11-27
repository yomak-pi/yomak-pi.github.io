-- Phase 4B part 2: chat list prefs (pin/mute/archive), group read marks, mute-aware DM push.
create table if not exists public.chat_prefs (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  chat_key text not null check (char_length(chat_key) <= 60),
  pinned boolean not null default false,
  muted boolean not null default false,
  archived boolean not null default false,
  primary key (user_id, chat_key)
);
alter table public.chat_prefs enable row level security;
create policy "prefs own select" on public.chat_prefs for select to authenticated using (user_id = auth.uid());
create policy "prefs own insert" on public.chat_prefs for insert to authenticated with check (user_id = auth.uid());
create policy "prefs own update" on public.chat_prefs for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "prefs own delete" on public.chat_prefs for delete to authenticated using (user_id = auth.uid());

create table if not exists public.group_reads (
  chat_id text not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  last_read_id bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (chat_id, user_id)
);
alter table public.group_reads enable row level security;
create policy "greads own select" on public.group_reads for select to authenticated using (user_id = auth.uid());
create policy "greads own insert" on public.group_reads for insert to authenticated with check (user_id = auth.uid());
create policy "greads own update" on public.group_reads for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- same function as before (push_config untouched), plus: skip push when the recipient muted this chat
create or replace function public.notify_dm() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare rcpt uuid; nm text; u text; s text;
begin
  begin
    select case when c.user_a = new.user_id then c.user_b else c.user_a end into rcpt from public.dm_chats c where c.id = new.chat_id;
    if rcpt is null then return new; end if;
    if exists (select 1 from public.chat_prefs p where p.user_id = rcpt and p.chat_key = 'd:' || new.chat_id::text and p.muted) then return new; end if;
    select name into nm from public.profiles where id = new.user_id;
    select value into u from public.push_config where key = 'url';
    select value into s from public.push_config where key = 'secret';
    perform net.http_post(url := u,
      headers := jsonb_build_object('Content-Type','application/json','x-push-secret', s),
      body := jsonb_build_object('mode','dm','user_id', rcpt, 'title', coalesce(nm,'رسالة جديدة'), 'body', left(coalesce(new.body,''),120)));
  exception when others then null;
  end;
  return new;
end $$;
