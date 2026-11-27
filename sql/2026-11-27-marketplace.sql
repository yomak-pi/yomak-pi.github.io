-- YOMAK Marketplace: additive columns only. Old listings keep working (category is derived from tab client-side).
alter table public.market_listings drop constraint if exists market_listings_tab_check;
alter table public.market_listings add constraint market_listings_tab_check
  check (tab in ('transport','sim','crafts','restaurants','shops','other','general'));
alter table public.market_listings add column if not exists category text check (category is null or char_length(category) <= 24);
alter table public.market_listings add column if not exists subcategory text check (subcategory is null or char_length(subcategory) <= 40);
alter table public.market_listings add column if not exists condition text check (condition is null or condition in ('new','like_new','used','fair'));
alter table public.market_listings add column if not exists price_num numeric(14,2) check (price_num is null or (price_num >= 0 and price_num <= 1000000000));
alter table public.market_listings add column if not exists negotiable boolean not null default false;
alter table public.market_listings add column if not exists views integer not null default 0;
alter table public.market_listings add column if not exists updated_at timestamptz not null default now();
create index if not exists market_listings_cat_idx on public.market_listings (category, created_at desc);
create index if not exists market_listings_price_idx on public.market_listings (price_num);

-- allow up to 8 photos
do $$ begin
  begin alter table public.market_listings drop constraint if exists market_listings_images_check; exception when others then null; end;
end $$;

-- count a view (anyone, not the owner); security definer so RLS on update does not block it
create or replace function public.mk_view(lid uuid) returns void language sql security definer set search_path=public as $$
  update public.market_listings set views = views + 1 where id = lid and (auth.uid() is null or user_id <> auth.uid());
$$;
grant execute on function public.mk_view(uuid) to anon, authenticated;
