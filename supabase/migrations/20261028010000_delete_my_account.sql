-- Lets a signed-in person permanently delete their own account.
-- Visits and the profile go with it (they cascade from auth.users). Stamp photos in
-- storage are removed by the app through the storage API before this is called.
-- Signed-in users can call this on purpose: it only ever deletes the caller's own account.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  delete from public.user_progress where user_id = auth.uid();
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
