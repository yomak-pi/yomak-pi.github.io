-- @mentions by person (picked from a list), stored as @{uuid|Name}. Notifies the mentioned people. Additive.
create or replace function public.trg_n_mention_tokens() returns trigger language plpgsql security definer set search_path = public as $$
declare m text[]; rcpt uuid; ref text; lbl text;
begin
  begin
    if tg_table_name = 'post_comments' then ref := new.post_id::text; lbl := 'ذكرك في تعليق'; else ref := new.id::text; lbl := 'ذكرك في منشور'; end if;
    for m in select regexp_matches(coalesce(new.body,''), '@\{([0-9a-fA-F-]{36})\|', 'g') loop
      rcpt := m[1]::uuid;
      if rcpt is distinct from new.user_id and exists (select 1 from public.profiles where id = rcpt) then
        perform public.notify_user(rcpt, new.user_id, 'mention', ref, lbl);
      end if;
    end loop;
  exception when others then null;
  end;
  return new;
end $$;
drop trigger if exists n_mention_post on public.service_posts;
create trigger n_mention_post after insert on public.service_posts for each row execute function public.trg_n_mention_tokens();
drop trigger if exists n_mention_comment on public.post_comments;
create trigger n_mention_comment after insert on public.post_comments for each row execute function public.trg_n_mention_tokens();
