create table if not exists pages(
 id bigint generated always as identity primary key,
 owner uuid not null references profiles(id) on delete cascade,
 name text not null, category text, about text, cover text, photo text,
 phone text, website text, email text, address text,
 followers_count int default 0, created_at timestamptz default now());
create table if not exists page_admins(
 page_id bigint references pages(id) on delete cascade,
 user_id uuid references profiles(id) on delete cascade,
 role text default 'admin', primary key(page_id,user_id));
create table if not exists page_follows(
 page_id bigint references pages(id) on delete cascade,
 user_id uuid references profiles(id) on delete cascade,
 created_at timestamptz default now(), primary key(page_id,user_id));
create table if not exists page_posts(
 id bigint generated always as identity primary key,
 page_id bigint references pages(id) on delete cascade,
 author uuid references profiles(id), body text, image text,
 created_at timestamptz default now());
create table if not exists page_reviews(
 page_id bigint references pages(id) on delete cascade,
 user_id uuid references profiles(id) on delete cascade,
 rating int check(rating between 1 and 5), body text,
 created_at timestamptz default now(), primary key(page_id,user_id));
create table if not exists page_messages(
 id bigint generated always as identity primary key,
 page_id bigint references pages(id) on delete cascade,
 user_id uuid references profiles(id) on delete cascade,
 from_page boolean default false, body text,
 created_at timestamptz default now());
create or replace function is_page_admin(p bigint) returns boolean language sql security definer stable as
$$select exists(select 1 from pages where id=p and owner=auth.uid()) or exists(select 1 from page_admins where page_id=p and user_id=auth.uid())$$;
create or replace function page_follow_count() returns trigger language plpgsql security definer as $$
begin
 if tg_op='INSERT' then update pages set followers_count=followers_count+1 where id=new.page_id;
 else update pages set followers_count=greatest(followers_count-1,0) where id=old.page_id; end if;
 return null; end $$;
drop trigger if exists trg_page_follow on page_follows;
create trigger trg_page_follow after insert or delete on page_follows for each row execute function page_follow_count();
alter table pages enable row level security; alter table page_admins enable row level security;
alter table page_follows enable row level security; alter table page_posts enable row level security;
alter table page_reviews enable row level security; alter table page_messages enable row level security;
create policy pages_read on pages for select using(true);
create policy pages_ins on pages for insert with check(owner=auth.uid());
create policy pages_upd on pages for update using(is_page_admin(id) or is_admin());
create policy pages_del on pages for delete using(owner=auth.uid() or is_admin());
create policy pa_read on page_admins for select using(true);
create policy pa_ins on page_admins for insert with check(exists(select 1 from pages where id=page_id and owner=auth.uid()));
create policy pa_del on page_admins for delete using(exists(select 1 from pages where id=page_id and owner=auth.uid()) or is_admin());
create policy pf_read on page_follows for select using(true);
create policy pf_ins on page_follows for insert with check(user_id=auth.uid());
create policy pf_del on page_follows for delete using(user_id=auth.uid());
create policy pp_read on page_posts for select using(true);
create policy pp_ins on page_posts for insert with check(is_page_admin(page_id) and author=auth.uid());
create policy pp_del on page_posts for delete using(is_page_admin(page_id) or is_admin());
create policy pr_read on page_reviews for select using(true);
create policy pr_ins on page_reviews for insert with check(user_id=auth.uid());
create policy pr_upd on page_reviews for update using(user_id=auth.uid());
create policy pr_del on page_reviews for delete using(user_id=auth.uid() or is_admin() or is_page_admin(page_id));
create policy pm_read on page_messages for select using(user_id=auth.uid() or is_page_admin(page_id));
create policy pm_ins on page_messages for insert with check((user_id=auth.uid() and from_page=false) or (from_page and is_page_admin(page_id)));
alter table reports drop constraint if exists reports_kind_check;
alter table reports add constraint reports_kind_check check(kind in('post','message','dm','group','service','office','property','review','comment','page','page_post'));
