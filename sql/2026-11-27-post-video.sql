-- Normal posts: optional video (stored in the reels bucket, own folder). Additive.
alter table public.service_posts add column if not exists video_url text check (video_url is null or char_length(video_url) <= 300);
