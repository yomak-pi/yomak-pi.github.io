alter table messages add column if not exists reply_to bigint;
alter table messages add column if not exists kind text default 'text';
alter table messages add column if not exists media_url text;
alter table messages add column if not exists media_secs int;
create table if not exists group_msg_reactions(
 message_id bigint references messages(id) on delete cascade,
 user_id uuid references profiles(id) on delete cascade,
 emoji text not null, created_at timestamptz default now(),
 primary key(message_id,user_id));
alter table group_msg_reactions enable row level security;
create policy gmr_read on group_msg_reactions for select using(exists(select 1 from messages m join group_members gm on gm.group_id=m.group_id and gm.user_id=auth.uid() where m.id=message_id) or is_admin());
create policy gmr_ins on group_msg_reactions for insert with check(user_id=auth.uid() and exists(select 1 from messages m join group_members gm on gm.group_id=m.group_id and gm.user_id=auth.uid() where m.id=message_id));
create policy gmr_upd on group_msg_reactions for update using(user_id=auth.uid());
create policy gmr_del on group_msg_reactions for delete using(user_id=auth.uid());
create policy gr_members_read on group_reads for select using(exists(select 1 from group_members gm where gm.group_id::text=group_reads.chat_id and gm.user_id=auth.uid()));
