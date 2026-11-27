-- YOMAK admin dashboard: stats RPC (admin only) and an earnings ledger (admin only). Additive.
create or replace function public.admin_stats() returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  select jsonb_build_object(
    'users', (select count(*) from profiles),
    'users_7d', (select count(*) from profiles where created_at > now() - interval '7 days'),
    'users_24h', (select count(*) from profiles where created_at > now() - interval '1 day'),
    'users_sa', (select count(*) from profiles where country = 'SA'),
    'users_eg', (select count(*) from profiles where country = 'EG'),
    'posts', (select count(*) from posts),
    'posts_7d', (select count(*) from posts where created_at > now() - interval '7 days'),
    'services', (select count(*) from service_posts),
    'listings', (select count(*) from market_listings),
    'listings_7d', (select count(*) from market_listings where created_at > now() - interval '7 days'),
    'reels', (select count(*) from reels),
    'reel_views', (select coalesce(sum(views),0) from reels),
    'jobs', (select count(*) from job_posts),
    'applications', (select count(*) from job_applications),
    'groups', (select count(*) from groups),
    'pages', (select count(*) from pages),
    'messages_24h', (select count(*) from messages where created_at > now() - interval '1 day') + (select count(*) from dm_messages where created_at > now() - interval '1 day'),
    'reports_open', (select count(*) from reports where status = 'open'),
    'bans_active', (select count(*) from bans where until is null or until > now()),
    'signups', coalesce((select jsonb_agg(jsonb_build_object('d', d, 'n', n) order by d) from (select g::date d, (select count(*) from profiles p where p.created_at::date = g::date) n from generate_series(current_date - 13, current_date, interval '1 day') g) s), '[]'::jsonb),
    'categories', coalesce((select jsonb_agg(jsonb_build_object('c', c, 'n', n)) from (select coalesce(category, tab) c, count(*) n from market_listings group by 1 order by 2 desc limit 8) t), '[]'::jsonb)
  ) into r;
  return r;
end $$;
revoke all on function public.admin_stats() from public, anon;
grant execute on function public.admin_stats() to authenticated;

create table if not exists public.admin_earnings (
  id bigint generated always as identity primary key,
  day date not null default current_date,
  source text not null check (char_length(source) between 1 and 60),
  amount numeric not null check (amount >= 0),
  currency text not null default 'SAR' check (currency in ('SAR','EGP','USD')),
  note text check (note is null or char_length(note) <= 200),
  created_at timestamptz not null default now()
);
alter table public.admin_earnings enable row level security;
create policy "earn admin read" on public.admin_earnings for select to authenticated using (public.is_admin());
create policy "earn admin insert" on public.admin_earnings for insert to authenticated with check (public.is_admin());
create policy "earn admin update" on public.admin_earnings for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "earn admin delete" on public.admin_earnings for delete to authenticated using (public.is_admin());
