-- Post controls: pin on profile, turn comments off, hide a post for me. Additive.
alter table public.service_posts add column if not exists pinned_at timestamptz;
alter table public.service_posts add column if not exists comments_off boolean not null default false;

create table if not exists public.post_hides (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  post_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
alter table public.post_hides enable row level security;
drop policy if exists "hide read own" on public.post_hides;
create policy "hide read own" on public.post_hides for select to authenticated using (user_id = auth.uid());
drop policy if exists "hide insert own" on public.post_hides;
create policy "hide insert own" on public.post_hides for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "hide delete own" on public.post_hides;
create policy "hide delete own" on public.post_hides for delete to authenticated using (user_id = auth.uid());

-- comments off is enforced by the database, not only the screen
create or replace function public.trg_comments_off() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.service_posts p where p.id = new.post_id and p.comments_off) and not public.is_admin() then
    raise exception 'التعليقات مقفولة على المنشور ده';
  end if;
  return new;
end $$;
drop trigger if exists comments_off_guard on public.post_comments;
create trigger comments_off_guard before insert on public.post_comments for each row execute function public.trg_comments_off();
