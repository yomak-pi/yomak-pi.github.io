-- server clock for call signalling (phones with a wrong clock were dropping calls). Additive.
create or replace function public.server_now() returns timestamptz language sql stable as $$ select now() $$;
grant execute on function public.server_now() to anon, authenticated;
