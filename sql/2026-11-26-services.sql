-- YOMAK Phase 1: services marketplace (يسر). NEW TABLES ONLY. No existing table or data changed.
create table if not exists public.service_providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  category text not null check (char_length(category) between 2 and 30),
  title text check (char_length(title) <= 80),
  bio text check (char_length(bio) <= 1000),
  phone text check (phone is null or phone ~ '^[0-9+]{7,16}$'),
  whatsapp boolean not null default false,
  country text not null default 'EG' check (country in ('EG','SA')),
  city text check (char_length(city) <= 40),
  areas text check (char_length(areas) <= 200),
  price_from numeric(12,2) check (price_from is null or (price_from >= 0 and price_from <= 100000000)),
  price_unit text check (char_length(price_unit) <= 20),
  active boolean not null default true,
  verified boolean not null default false,
  rating_avg numeric(3,2) not null default 0,
  rating_count int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists service_providers_cat_idx on public.service_providers (country, category, rating_avg desc);
create index if not exists service_providers_city_idx on public.service_providers (country, city);
alter table public.service_providers enable row level security;
create policy "svc read all" on public.service_providers for select to anon, authenticated using (active or user_id = auth.uid());
create policy "svc insert own" on public.service_providers for insert to authenticated with check (user_id = auth.uid() and verified = false and rating_count = 0);
create policy "svc update own" on public.service_providers for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "svc delete own" on public.service_providers for delete to authenticated using (user_id = auth.uid());

-- owners cannot change verified / rating fields (only the dashboard/service role can)
create or replace function public.svc_guard() returns trigger language plpgsql as $$
begin
  if auth.role() = 'authenticated' then
    new.verified := old.verified; new.rating_avg := old.rating_avg; new.rating_count := old.rating_count; new.user_id := old.user_id;
  end if;
  return new;
end $$;
drop trigger if exists trg_svc_guard on public.service_providers;
create trigger trg_svc_guard before update on public.service_providers for each row execute function public.svc_guard();

create table if not exists public.service_reviews (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.service_providers(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 500),
  created_at timestamptz not null default now(),
  unique (provider_id, user_id)
);
alter table public.service_reviews enable row level security;
create policy "rev read all" on public.service_reviews for select to anon, authenticated using (true);
create policy "rev insert own" on public.service_reviews for insert to authenticated
  with check (user_id = auth.uid() and not exists (select 1 from public.service_providers p where p.id = provider_id and p.user_id = auth.uid()));
create policy "rev update own" on public.service_reviews for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "rev delete own" on public.service_reviews for delete to authenticated using (user_id = auth.uid());

create or replace function public.svc_rate() returns trigger language plpgsql security definer set search_path = public as $$
declare pid uuid := coalesce(new.provider_id, old.provider_id);
begin
  update public.service_providers p set
    rating_avg = coalesce((select round(avg(rating)::numeric, 2) from public.service_reviews where provider_id = pid), 0),
    rating_count = (select count(*) from public.service_reviews where provider_id = pid)
  where p.id = pid;
  return null;
end $$;
drop trigger if exists trg_svc_rate on public.service_reviews;
create trigger trg_svc_rate after insert or update or delete on public.service_reviews for each row execute function public.svc_rate();

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  provider_id uuid references public.service_providers(id) on delete cascade,
  category text check (char_length(category) <= 30),
  city text check (char_length(city) <= 40),
  details text not null check (char_length(details) between 3 and 800),
  phone text check (phone is null or phone ~ '^[0-9+]{7,16}$'),
  status text not null default 'open' check (status in ('open','done','cancelled')),
  created_at timestamptz not null default now()
);
create index if not exists service_requests_provider_idx on public.service_requests (provider_id, created_at desc);
alter table public.service_requests enable row level security;
create policy "req read own or addressed" on public.service_requests for select to authenticated
  using (user_id = auth.uid() or exists (select 1 from public.service_providers p where p.id = provider_id and p.user_id = auth.uid()));
create policy "req insert own" on public.service_requests for insert to authenticated with check (user_id = auth.uid());
create policy "req update own" on public.service_requests for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "req delete own" on public.service_requests for delete to authenticated using (user_id = auth.uid());
