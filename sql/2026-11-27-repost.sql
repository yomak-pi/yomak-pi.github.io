-- Reposts: a post can be shared again on another user's page. Additive.
alter table public.service_posts add column if not exists repost_of uuid references public.service_posts(id) on delete set null;
alter table public.service_posts add column if not exists repost_from uuid;
create unique index if not exists service_posts_one_repost on public.service_posts (user_id, repost_of) where repost_of is not null;
