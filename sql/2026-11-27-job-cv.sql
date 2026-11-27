-- Job applications: optional CV file (private bucket, 2 MB, pdf/doc/docx). Additive.
alter table public.job_applications add column if not exists cv_path text check (cv_path is null or char_length(cv_path) <= 200);
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cvs','cvs',false,2097152,array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set public=false, file_size_limit=2097152, allowed_mime_types=array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
create policy "cvs insert own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "cvs read owner employer admin" on storage.objects for select to authenticated
  using (bucket_id = 'cvs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()
    or exists (select 1 from public.job_applications a join public.job_posts j on j.id = a.job_id where a.cv_path = storage.objects.name and j.user_id = auth.uid())));
create policy "cvs delete own or admin" on storage.objects for delete to authenticated
  using (bucket_id = 'cvs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
