-- REFILLS SHOP: configuración pública sincronizada entre dispositivos
-- Ejecuta este archivo completo en Supabase SQL Editor una sola vez.
-- NO almacena usuarios, teléfonos, Wallets, depósitos ni pedidos.
create table if not exists public.refills_site_config (
  id text primary key check (id = 'main'),
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by text
);

alter table public.refills_site_config enable row level security;
revoke all on public.refills_site_config from anon, authenticated;
grant select, insert, update on public.refills_site_config to service_role;

comment on table public.refills_site_config is
  'Public storefront configuration only. Read/write through liogames-gateway; never put private user or payment data here.';
