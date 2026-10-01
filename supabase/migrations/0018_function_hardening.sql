-- 0018_function_hardening: close Supabase security-advisor warnings.
-- handle_new_user is a trigger function: callers never need EXECUTE.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
-- has_builder_access(uid) let anyone probe whether any user id has paid.
revoke execute on function public.has_builder_access(uuid) from public, anon;
alter function public.set_updated_at() set search_path = public;
alter function public.enforce_product_limit() set search_path = public;
