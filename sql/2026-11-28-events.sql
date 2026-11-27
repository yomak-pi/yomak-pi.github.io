-- Events (Facebook style): create, RSVP going/interested/not going, counts, notify host. Additive.
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 100),
  body text check (body is null or char_length(body) <= 1000),
  starts_at timestamptz not null,
  ends_at timestamptz,
  place text check (place is null or char_length(place) <= 120),
  city text check (city is null or char_length(city) <= 60),
  visibility text not null default 'public' check (visibility in ('public','friends')),
  created_at timestamptz not null default now()
);
create index if not exists events_starts_idx on public.events (starts_at);
alter table public.events enable row level security;
drop policy if exists "ev read" on public.events;
create policy "ev read" on public.events for select to anon, authenticated using (visibility = 'public' or user_id = auth.uid() or is_admin() or (visibility = 'friends' and are_friends(auth.uid(), user_id)));
drop policy if exists "ev insert own" on public.events;
create policy "ev insert own" on public.events for insert to authenticated with check (user_id = auth.uid() and not is_banned());
drop policy if exists "ev update own" on public.events;
create policy "ev update own" on public.events for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and not is_banned());
drop policy if exists "ev delete own or admin" on public.events;
create policy "ev delete own or admin" on public.events for delete to authenticated using (user_id = auth.uid() or is_admin());

create table if not exists public.event_rsvps (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  status text not null check (status in ('going','interested','no')),
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
alter table public.event_rsvps enable row level security;
drop policy if exists "rsvp read" on public.event_rsvps;
create policy "rsvp read" on public.event_rsvps for select to authenticated using (exists (select 1 from public.events e where e.id = event_id));
drop policy if exists "rsvp insert own" on public.event_rsvps;
create policy "rsvp insert own" on public.event_rsvps for insert to authenticated with check (user_id = auth.uid() and not is_banned());
drop policy if exists "rsvp update own" on public.event_rsvps;
create policy "rsvp update own" on public.event_rsvps for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "rsvp delete own" on public.event_rsvps;
create policy "rsvp delete own" on public.event_rsvps for delete to authenticated using (user_id = auth.uid());

create or replace function public.event_counts(ids uuid[]) returns table(event_id uuid, going bigint, interested bigint, mine text)
language sql stable security invoker as $$
  select r.event_id, count(*) filter (where r.status='going'), count(*) filter (where r.status='interested'),
         max(r.status) filter (where r.user_id = auth.uid())
  from public.event_rsvps r where r.event_id = any(ids) group by r.event_id $$;
grant execute on function public.event_counts(uuid[]) to authenticated;

create or replace function public.trg_n_event_rsvp() returns trigger language plpgsql security definer set search_path = public as $$
declare host uuid; ttl text;
begin
  begin
    if new.status in ('going','interested') then
      select user_id, title into host, ttl from public.events where id = new.event_id;
      if host is not null and host <> new.user_id then
        perform public.notify_user(host, new.user_id, 'event', new.event_id::text, case new.status when 'going' then 'هيحضر فعاليتك: ' else 'مهتم بفعاليتك: ' end || left(coalesce(ttl,''),40));
      end if;
    end if;
  exception when others then null;
  end;
  return new;
end $$;
drop trigger if exists n_event_rsvp on public.event_rsvps;
create trigger n_event_rsvp after insert on public.event_rsvps for each row execute function public.trg_n_event_rsvp();
