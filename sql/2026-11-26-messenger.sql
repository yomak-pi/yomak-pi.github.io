-- YOMAK Phase 4B: Messenger-style DMs. Adds columns/tables/bucket only; nothing removed.
alter table public.dm_messages add column if not exists reply_to text;
alter table public.dm_messages add column if not exists kind text not null default 'text';
alter table public.dm_messages add column if not exists media_url text;
alter table public.dm_messages add column if not exists media_secs int;
alter table public.dm_messages add column if not exists edited_at timestamptz;

create or replace function public.is_dm_member(chat text, uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.dm_chats c where c.id::text = chat and (c.user_a = uid or c.user_b = uid))
$$;

create table if not exists public.dm_reads (
  chat_id text not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  last_read_id bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (chat_id, user_id)
);
alter table public.dm_reads enable row level security;
create policy "reads see" on public.dm_reads for select to authenticated using (public.is_dm_member(chat_id, auth.uid()));
create policy "reads ins" on public.dm_reads for insert to authenticated with check (user_id = auth.uid() and public.is_dm_member(chat_id, auth.uid()));
create policy "reads upd" on public.dm_reads for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_dm_member(chat_id, auth.uid()));

create table if not exists public.dm_reactions (
  chat_id text not null,
  message_id text not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  emoji text not null check (char_length(emoji) <= 8),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);
create index if not exists dm_reactions_chat_idx on public.dm_reactions (chat_id);
alter table public.dm_reactions enable row level security;
create policy "dmrx see" on public.dm_reactions for select to authenticated using (public.is_dm_member(chat_id, auth.uid()));
create policy "dmrx ins" on public.dm_reactions for insert to authenticated with check (user_id = auth.uid() and public.is_dm_member(chat_id, auth.uid()));
create policy "dmrx upd" on public.dm_reactions for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_dm_member(chat_id, auth.uid()));
create policy "dmrx del" on public.dm_reactions for delete to authenticated using (user_id = auth.uid());

-- media bucket for voice notes and chat images (public URLs are unguessable; 10 MB cap)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-media', 'chat-media', true, 10485760, array['audio/webm','audio/ogg','audio/mp4','audio/mpeg','audio/aac','audio/wav','image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
create policy "chatmedia insert own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'chat-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "chatmedia read" on storage.objects for select to anon, authenticated using (bucket_id = 'chat-media');

-- realtime for read receipts and reactions (ignore if already added)
do $$ begin
  begin alter publication supabase_realtime add table public.dm_reads; exception when others then null; end;
  begin alter publication supabase_realtime add table public.dm_reactions; exception when others then null; end;
end $$;
