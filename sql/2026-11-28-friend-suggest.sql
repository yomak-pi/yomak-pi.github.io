-- friendships RLS only shows a user their own rows, so friends-of-friends needs a definer function. Additive.
create or replace function public.friend_suggestions()
returns table(id uuid, mutual uuid[]) language sql security definer stable set search_path=public as $$
  with f as (
    select case when requester=auth.uid() then addressee else requester end as fid
    from friendships where status='accepted' and (requester=auth.uid() or addressee=auth.uid())),
  rel as (
    select requester as x from friendships where requester=auth.uid() or addressee=auth.uid()
    union select addressee from friendships where requester=auth.uid() or addressee=auth.uid()),
  fof as (
    select case when fr.requester=f.fid then fr.addressee else fr.requester end as oid, f.fid
    from friendships fr join f on (fr.requester=f.fid or fr.addressee=f.fid) where fr.status='accepted')
  select oid, array_agg(distinct fid) from fof
  where oid<>auth.uid() and oid not in (select x from rel)
  group by oid order by count(distinct fid) desc limit 20 $$;
create or replace function public.mutual_friends(other uuid)
returns setof uuid language sql security definer stable set search_path=public as $$
  select a.fid from
   (select case when requester=auth.uid() then addressee else requester end as fid from friendships where status='accepted' and (requester=auth.uid() or addressee=auth.uid())) a
  join
   (select case when requester=other then addressee else requester end as fid from friendships where status='accepted' and (requester=other or addressee=other)) b
  on a.fid=b.fid $$;
revoke all on function public.friend_suggestions() from public, anon;
revoke all on function public.mutual_friends(uuid) from public, anon;
grant execute on function public.friend_suggestions() to authenticated;
grant execute on function public.mutual_friends(uuid) to authenticated;
create or replace function public.friend_count(u uuid)
returns integer language sql security definer stable set search_path=public as $$
  select count(*)::int from friendships where status='accepted' and (requester=u or addressee=u) $$;
revoke all on function public.friend_count(uuid) from public, anon;
grant execute on function public.friend_count(uuid) to authenticated;
