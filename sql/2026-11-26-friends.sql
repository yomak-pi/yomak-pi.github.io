create table if not exists friendships(
 id bigint generated always as identity primary key,
 requester uuid not null references profiles(id) on delete cascade,
 addressee uuid not null references profiles(id) on delete cascade,
 status text not null default 'pending' check(status in('pending','accepted')),
 created_at timestamptz default now(),
 unique(requester,addressee), check(requester<>addressee));
alter table friendships enable row level security;
create policy fr_read on friendships for select using(requester=auth.uid() or addressee=auth.uid() or is_admin());
create policy fr_ins on friendships for insert with check(requester=auth.uid() and status='pending');
create policy fr_upd on friendships for update using(addressee=auth.uid()) with check(addressee=auth.uid() and status='accepted');
create policy fr_del on friendships for delete using(requester=auth.uid() or addressee=auth.uid() or is_admin());
create or replace function trg_n_friend() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if tg_op='INSERT' then perform notify_user(new.addressee,new.requester,'friend_req',new.requester::text,'أرسل لك طلب صداقة');
 elsif tg_op='UPDATE' and new.status='accepted' and old.status='pending' then perform notify_user(new.requester,new.addressee,'friend_ok',new.addressee::text,'قبل طلب صداقتك'); end if;
 return null; end $$;
drop trigger if exists n_friend on friendships;
create trigger n_friend after insert or update on friendships for each row execute function trg_n_friend();
