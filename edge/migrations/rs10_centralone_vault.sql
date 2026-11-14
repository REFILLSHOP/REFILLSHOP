-- Supabase Vault integration for Central One. Never commit supplier secrets.
create or replace function public.rs10_store_centralone_catalog_key(p_key text)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare v_id uuid;
begin
  if p_key is null or p_key !~ '^co_live_[a-zA-Z0-9_-]{20,180}$' then
    raise exception 'INVALID_CENTRALONE_KEY';
  end if;
  select id into v_id from vault.secrets where name='rs10_centralone_catalog_api_key' order by created_at desc limit 1;
  if v_id is null then
    perform vault.create_secret(p_key,'rs10_centralone_catalog_api_key','Refills Shop V10: private Central One read-only catalog key');
  else
    perform vault.update_secret(v_id,p_key);
  end if;
  return true;
end $$;
create or replace function public.rs10_read_centralone_catalog_key()
returns text language sql stable security definer set search_path = ''
as $$ select decrypted_secret from vault.decrypted_secrets where name='rs10_centralone_catalog_api_key' order by created_at desc limit 1 $$;
revoke all on function public.rs10_store_centralone_catalog_key(text) from public,anon,authenticated;
revoke all on function public.rs10_read_centralone_catalog_key() from public,anon,authenticated;
grant execute on function public.rs10_store_centralone_catalog_key(text) to service_role;
grant execute on function public.rs10_read_centralone_catalog_key() to service_role;
create unique index if not exists rs10_centralone_product_unique on public.rs5_offers(provider_product_key)
where provider_name='centralone' and provider_product_key is not null;