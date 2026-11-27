-- Birthdays (month/day only, no year). Additive.
create table if not exists public.user_birthdays(
  user_id uuid primary key,
  bmonth smallint not null check (bmonth between 1 and 12),
  bday smallint not null check (bday between 1 and 31),
  visibility text not null default 'friends' check (visibility in ('public','friends','me')),
  updated_at timestamptz not null default now());
alter table public.user_birthdays enable row level security;
drop policy if exists "bd read" on public.user_birthdays;
create policy "bd read" on public.user_birthdays for select to authenticated using (
  user_id = auth.uid() or public.is_admin() or visibility = 'public' or (visibility = 'friends' and public.are_friends(auth.uid(), user_id)));
drop policy if exists "bd ins" on public.user_birthdays;
create policy "bd ins" on public.user_birthdays for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "bd upd" on public.user_birthdays;
create policy "bd upd" on public.user_birthdays for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "bd del" on public.user_birthdays;
create policy "bd del" on public.user_birthdays for delete to authenticated using (user_id = auth.uid());
