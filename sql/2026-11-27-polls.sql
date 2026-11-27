-- Polls in posts. Additive.
alter table public.service_posts add column if not exists poll jsonb check (poll is null or (jsonb_typeof(poll)='array' and jsonb_array_length(poll) between 2 and 4));
create table if not exists public.post_poll_votes (
  post_id uuid not null references public.service_posts(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  option_idx smallint not null check (option_idx between 0 and 3),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.post_poll_votes enable row level security;
create policy "poll votes read" on public.post_poll_votes for select to authenticated using (true);
create policy "poll votes insert own" on public.post_poll_votes for insert to authenticated with check (user_id = auth.uid() and not public.is_banned());
create policy "poll votes delete own" on public.post_poll_votes for delete to authenticated using (user_id = auth.uid() or public.is_admin());
create or replace function public.poll_counts(ids uuid[])
returns table(post_id uuid, option_idx smallint, n bigint, mine boolean)
language sql stable security invoker as $$
  select v.post_id, v.option_idx, count(*)::bigint, bool_or(v.user_id = auth.uid())
  from public.post_poll_votes v where v.post_id = any(ids) group by v.post_id, v.option_idx
$$;
grant execute on function public.poll_counts(uuid[]) to authenticated;
