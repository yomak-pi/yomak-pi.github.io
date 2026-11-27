-- Active status / last seen (friends only, user can switch it off). Additive.
create table if not exists public.user_presence(
  user_id uuid primary key,
  last_seen timestamptz not null default now(),
  show_status boolean not null default true);
alter table public.user_presence enable row level security;
drop policy if exists "pres read" on public.user_presence;
create policy "pres read" on public.user_presence for select to authenticated using (
  user_id = auth.uid() or (show_status and public.are_friends(auth.uid(), user_id)));
drop policy if exists "pres ins" on public.user_presence;
create policy "pres ins" on public.user_presence for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "pres upd" on public.user_presence;
create policy "pres upd" on public.user_presence for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
