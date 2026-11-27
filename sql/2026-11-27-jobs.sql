-- YOMAK Jobs: employers post jobs, job seekers apply in the app. Additive.
create table if not exists public.job_posts (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 100),
  company text check (company is null or char_length(company) <= 80),
  city text check (city is null or char_length(city) <= 60),
  country text not null default 'EG' check (country in ('EG','SA')),
  job_type text not null default 'full' check (job_type in ('full','part','contract','intern','remote')),
  field text check (field is null or char_length(field) <= 30),
  salary_min numeric check (salary_min is null or salary_min >= 0),
  salary_max numeric check (salary_max is null or salary_max >= 0),
  description text not null check (char_length(description) between 10 and 3000),
  requirements text check (requirements is null or char_length(requirements) <= 2000),
  contact_phone text check (contact_phone is null or char_length(contact_phone) <= 24),
  status text not null default 'open' check (status in ('open','closed')),
  created_at timestamptz not null default now()
);
create index if not exists job_posts_list_idx on public.job_posts (status, created_at desc);
create index if not exists job_posts_user_idx on public.job_posts (user_id);
alter table public.job_posts enable row level security;
create policy "jobs read" on public.job_posts for select to anon, authenticated using (true);
create policy "jobs insert own" on public.job_posts for insert to authenticated with check (user_id = auth.uid());
create policy "jobs update own" on public.job_posts for update to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "jobs delete own or admin" on public.job_posts for delete to authenticated using (user_id = auth.uid() or public.is_admin());

create table if not exists public.job_applications (
  id bigint generated always as identity primary key,
  job_id bigint not null references public.job_posts(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  phone text check (phone is null or char_length(phone) <= 24),
  experience text check (experience is null or char_length(experience) <= 1000),
  message text check (message is null or char_length(message) <= 1000),
  status text not null default 'new' check (status in ('new','shortlisted','rejected')),
  created_at timestamptz not null default now(),
  unique (job_id, user_id)
);
create index if not exists job_apps_job_idx on public.job_applications (job_id, created_at desc);
create index if not exists job_apps_user_idx on public.job_applications (user_id);
alter table public.job_applications enable row level security;
create policy "japps read parties" on public.job_applications for select to authenticated
  using (user_id = auth.uid() or public.is_admin() or exists (select 1 from public.job_posts j where j.id = job_id and j.user_id = auth.uid()));
create policy "japps insert own" on public.job_applications for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.job_posts j where j.id = job_id and j.status = 'open' and j.user_id <> auth.uid()));
create policy "japps update employer" on public.job_applications for update to authenticated
  using (public.is_admin() or exists (select 1 from public.job_posts j where j.id = job_id and j.user_id = auth.uid()))
  with check (public.is_admin() or exists (select 1 from public.job_posts j where j.id = job_id and j.user_id = auth.uid()));
create policy "japps delete own" on public.job_applications for delete to authenticated using (user_id = auth.uid() or public.is_admin());

create or replace function public.job_app_notify() returns trigger language plpgsql security definer set search_path = public as $$
declare t text; o uuid;
begin
  select title, user_id into t, o from public.job_posts where id = new.job_id;
  if tg_op = 'INSERT' then
    perform public.notify_user(o, new.user_id, 'job_app', new.job_id::text, 'قدّم على وظيفتك: ' || left(coalesce(t,''),50));
  elsif new.status is distinct from old.status and new.status in ('shortlisted','rejected') then
    perform public.notify_user(new.user_id, o, 'job_status', new.job_id::text,
      case when new.status = 'shortlisted' then 'تم اختيارك مبدئيًا لوظيفة: ' else 'رد على طلبك لوظيفة: ' end || left(coalesce(t,''),50));
  end if;
  return new;
end $$;
drop trigger if exists job_app_notify_trg on public.job_applications;
create trigger job_app_notify_trg after insert or update on public.job_applications for each row execute function public.job_app_notify();
