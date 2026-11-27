create table if not exists stories(
 id bigint generated always as identity primary key,
 user_id uuid not null references profiles(id) on delete cascade,
 media_url text, body text, bg text default '#155b50',
 created_at timestamptz default now(),
 expires_at timestamptz default now()+interval '24 hours',
 check(media_url is not null or body is not null));
create table if not exists story_views(
 story_id bigint references stories(id) on delete cascade,
 user_id uuid references profiles(id) on delete cascade,
 created_at timestamptz default now(), primary key(story_id,user_id));
create or replace function story_can_see(owner uuid) returns boolean language sql security definer stable set search_path=public as $$
 select owner=auth.uid() or is_admin()
  or exists(select 1 from friendships f where f.status='accepted' and ((f.requester=auth.uid() and f.addressee=owner) or (f.addressee=auth.uid() and f.requester=owner)))
  or exists(select 1 from follows w where w.follower=auth.uid() and w.following=owner) $$;
alter table stories enable row level security; alter table story_views enable row level security;
create policy st_read on stories for select using(expires_at>now() and story_can_see(user_id));
create policy st_ins on stories for insert with check(user_id=auth.uid());
create policy st_del on stories for delete using(user_id=auth.uid() or is_admin());
create policy sv_ins on story_views for insert with check(user_id=auth.uid());
create policy sv_read on story_views for select using(user_id=auth.uid() or exists(select 1 from stories s where s.id=story_id and s.user_id=auth.uid()));
