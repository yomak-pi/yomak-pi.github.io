create table if not exists profile_info(
 user_id uuid primary key references profiles(id) on delete cascade,
 work text, study text, hometown text, relationship text, website text,
 updated_at timestamptz default now());
alter table profile_info enable row level security;
create policy pi_read on profile_info for select using(true);
create policy pi_ins on profile_info for insert with check(user_id=auth.uid());
create policy pi_upd on profile_info for update using(user_id=auth.uid());
