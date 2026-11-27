alter table market_listings add column if not exists images text[];
alter table market_listings add column if not exists status text not null default 'active';
create table if not exists market_favs(
 user_id uuid references profiles(id) on delete cascade,
 listing_id uuid references market_listings(id) on delete cascade,
 created_at timestamptz default now(), primary key(user_id,listing_id));
alter table market_favs enable row level security;
create policy mf_own on market_favs for all using(user_id=auth.uid()) with check(user_id=auth.uid());
alter table reports drop constraint if exists reports_kind_check;
alter table reports add constraint reports_kind_check check(kind in('post','message','dm','group','service','office','property','review','comment','page','page_post','market'));
