create table if not exists saved_posts(
 user_id uuid references profiles(id) on delete cascade,
 post_id text not null, kind text not null default 'svc',
 created_at timestamptz default now(), primary key(user_id,post_id));
alter table saved_posts enable row level security;
create policy sp_own on saved_posts for all using(user_id=auth.uid()) with check(user_id=auth.uid());
alter table service_posts add column if not exists visibility text not null default 'public';
alter table service_posts add column if not exists edited_at timestamptz;
create or replace function are_friends(a uuid,b uuid) returns boolean language sql security definer stable set search_path=public as $$
 select exists(select 1 from friendships f where f.status='accepted' and ((f.requester=a and f.addressee=b) or (f.requester=b and f.addressee=a))) $$;
create policy svc_audience on service_posts as restrictive for select using(
 visibility='public' or user_id=auth.uid() or is_admin() or (visibility='friends' and are_friends(auth.uid(),user_id)));
