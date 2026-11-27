-- YOMAK Reels: short vertical videos. New tables + a free-tier-sized storage bucket (30 MB per file).
create table if not exists public.reels (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  video_url text not null check (video_url ~ '^https://' and char_length(video_url) <= 400),
  caption text check (caption is null or char_length(caption) <= 200),
  duration_s integer check (duration_s is null or duration_s between 1 and 90),
  country text not null default 'EG' check (country in ('EG','SA')),
  views integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists reels_created_idx on public.reels (created_at desc);
create index if not exists reels_user_idx on public.reels (user_id);
alter table public.reels enable row level security;
create policy "reels read" on public.reels for select to anon, authenticated using (true);
create policy "reels insert own" on public.reels for insert to authenticated with check (user_id = auth.uid());
create policy "reels update own" on public.reels for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "reels delete own or admin" on public.reels for delete to authenticated using (user_id = auth.uid() or public.is_admin());

create table if not exists public.reel_likes (
  reel_id bigint not null references public.reels(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (reel_id, user_id)
);
alter table public.reel_likes enable row level security;
create policy "rl read" on public.reel_likes for select to anon, authenticated using (true);
create policy "rl insert own" on public.reel_likes for insert to authenticated with check (user_id = auth.uid());
create policy "rl delete own" on public.reel_likes for delete to authenticated using (user_id = auth.uid());

create table if not exists public.reel_comments (
  id bigint generated always as identity primary key,
  reel_id bigint not null references public.reels(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists reel_comments_reel_idx on public.reel_comments (reel_id, created_at);
alter table public.reel_comments enable row level security;
create policy "rc read" on public.reel_comments for select to anon, authenticated using (true);
create policy "rc insert own" on public.reel_comments for insert to authenticated with check (user_id = auth.uid());
create policy "rc delete own or admin" on public.reel_comments for delete to authenticated using (user_id = auth.uid() or public.is_admin());

create or replace function public.reel_view(rid bigint) returns void language sql security definer set search_path=public as $$
  update public.reels set views = views + 1 where id = rid;
$$;
grant execute on function public.reel_view(bigint) to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('reels','reels',true,31457280,array['video/mp4','video/webm','video/quicktime'])
on conflict (id) do update set public=true, file_size_limit=31457280, allowed_mime_types=array['video/mp4','video/webm','video/quicktime'];
create policy "reels insert own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'reels' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "reels read files" on storage.objects for select to anon, authenticated using (bucket_id = 'reels');
create policy "reels delete own files" on storage.objects for delete to authenticated
  using (bucket_id = 'reels' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

