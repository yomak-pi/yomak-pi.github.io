create or replace function trg_n_call() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.kind='offer' and coalesce(new.payload->>'restart','')<>'true' then
  perform notify_user(new.to_uid,new.from_uid,'call',new.call_id::text,'📞 مكالمة واردة');
 end if; return null; end $$;
drop trigger if exists n_call on call_signals;
create trigger n_call after insert on call_signals for each row execute function trg_n_call();
