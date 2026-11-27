do $$ declare c record; begin
 for c in select conname from pg_constraint where conrelid='public.post_reactions'::regclass and contype='c' and pg_get_constraintdef(oid) ilike '%kind%' loop
  execute 'alter table public.post_reactions drop constraint '||quote_ident(c.conname);
 end loop; end $$;
alter table public.post_reactions add constraint post_reactions_kind_check check (kind in ('like','love','care','haha','wow','sad','angry'));
alter table public.comment_likes add column if not exists kind text not null default 'like';
alter table public.comment_likes drop constraint if exists comment_likes_kind_check;
alter table public.comment_likes add constraint comment_likes_kind_check check (kind in ('like','love','care','haha','wow','sad','angry'));
drop policy if exists "cl update own" on public.comment_likes;
create policy "cl update own" on public.comment_likes for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
