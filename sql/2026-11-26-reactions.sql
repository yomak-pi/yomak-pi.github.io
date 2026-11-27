-- YOMAK Phase 4A: post reactions, comment replies, comment likes. Adds new tables/columns only.
create table if not exists public.post_reactions (
  post_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null default 'like' check (kind in ('like','love','haha','wow','sad','angry')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index if not exists post_reactions_post_idx on public.post_reactions (post_id);
alter table public.post_reactions enable row level security;
create policy "rx read" on public.post_reactions for select to anon, authenticated using (true);
create policy "rx insert own" on public.post_reactions for insert to authenticated with check (user_id = auth.uid());
create policy "rx update own" on public.post_reactions for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "rx delete own" on public.post_reactions for delete to authenticated using (user_id = auth.uid());
-- bring existing likes over as 'like' reactions
insert into public.post_reactions (post_id, user_id, kind)
  select post_id, user_id, 'like' from public.post_likes on conflict do nothing;

alter table public.post_comments add column if not exists parent_id uuid references public.post_comments(id) on delete cascade;
create index if not exists post_comments_parent_idx on public.post_comments (parent_id);

create table if not exists public.comment_likes (
  comment_id uuid not null references public.post_comments(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);
alter table public.comment_likes enable row level security;
create policy "cl read" on public.comment_likes for select to anon, authenticated using (true);
create policy "cl insert own" on public.comment_likes for insert to authenticated with check (user_id = auth.uid());
create policy "cl delete own" on public.comment_likes for delete to authenticated using (user_id = auth.uid());
