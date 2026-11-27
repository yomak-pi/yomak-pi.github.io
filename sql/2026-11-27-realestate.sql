-- Real estate inside the market: map position, size, rooms, purpose. Additive columns only.
alter table public.market_listings add column if not exists lat double precision check (lat is null or lat between -90 and 90);
alter table public.market_listings add column if not exists lng double precision check (lng is null or lng between -180 and 180);
alter table public.market_listings add column if not exists area_m2 numeric(10,2) check (area_m2 is null or (area_m2 > 0 and area_m2 <= 100000000));
alter table public.market_listings add column if not exists bedrooms smallint check (bedrooms is null or bedrooms between 0 and 50);
alter table public.market_listings add column if not exists bathrooms smallint check (bathrooms is null or bathrooms between 0 and 50);
alter table public.market_listings add column if not exists purpose text check (purpose is null or purpose in ('sale','rent'));
alter table public.market_listings add column if not exists furnished boolean;
alter table public.market_listings add column if not exists district text check (district is null or char_length(district) <= 60);
create index if not exists market_listings_geo_idx on public.market_listings (category, lat, lng);
