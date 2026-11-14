-- Refills Shop V7: Central One UUID provider and dynamic target fields.
-- APPLIED to project kcgjlnymhmxylrjchcvl (2026-11-11).
-- Kept here for code review and other environments. Safe to rerun.

alter table public.rs5_offers alter column provider_product_id drop not null;
alter table public.rs5_offers add column if not exists provider_name text not null default 'recargasamerica' check (provider_name in ('recargasamerica','centralone'));
alter table public.rs5_offers add column if not exists provider_product_key text;
alter table public.rs5_offers add column if not exists provider_family text;
alter table public.rs5_offers add column if not exists provider_region text;
alter table public.rs5_offers add column if not exists provider_target_schema jsonb not null default '[]'::jsonb;
alter table public.rs5_offers add column if not exists provider_in_stock boolean not null default true;
alter table public.rs5_offers add column if not exists provider_price_updated_at timestamptz;
create unique index if not exists rs5_provider_product_unique_idx on public.rs5_offers (provider_name, provider_product_key) where provider_product_key is not null;
create index if not exists rs5_offers_provider_idx on public.rs5_offers(provider_name);
update public.rs5_offers set provider_product_key=provider_product_id::text where provider_product_key is null and provider_product_id is not null;
alter table public.rs5_orders add column if not exists target_payload jsonb not null default '{}'::jsonb;