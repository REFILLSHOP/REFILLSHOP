-- REFILLS SHOP V5: run ONLY in a NEW Supabase project chosen for the new organization.
-- No existing REFILLSHOP / rs4_* tables are modified.
create extension if not exists pgcrypto;

create table if not exists public.rs5_games (
 id text primary key check (id ~ '^[a-z0-9-]{2,60}$'),
 name text not null check (char_length(name) between 2 and 90),
 category text not null default 'Juegos',
 image_url text,
 featured boolean not null default false,
 sort_order integer not null default 99,
 active boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.rs5_offers (
 id uuid primary key default gen_random_uuid(),
 game_id text not null references public.rs5_games(id) on delete cascade,
 provider_product_id bigint not null unique,
 name text not null,
 provider_price_usdt numeric(14,5) not null check(provider_price_usdt > 0),
 gain_sm numeric(14,2) not null default 0 check(gain_sm >= 0),
 active boolean not null default true,
 updated_at timestamptz not null default now()
);
create index if not exists rs5_offers_game_idx on public.rs5_offers(game_id);

create table if not exists public.rs5_settings (
 id integer primary key check(id=1),
 buy_sm_per_usdt numeric(16,4) not null default 350 check(buy_sm_per_usdt > 0),
 cup_per_sm numeric(14,4) not null default 3 check(cup_per_sm > 0),
 card_fee_pct numeric(6,2) not null default 5 check(card_fee_pct between 0 and 100),
 mobile_phone text not null default '50237996',
 wallet_phone text,
 card_number text not null default '9204-1299-7870-3553',
 confirm_phone text not null default '50237996',
 reseller_plan_price_usdt numeric(14,2) check(reseller_plan_price_usdt is null or reseller_plan_price_usdt > 0),
 reseller_plan_days integer not null default 30 check(reseller_plan_days between 1 and 365),
 updated_at timestamptz not null default now()
);
insert into public.rs5_settings(id) values(1) on conflict(id) do nothing;

create table if not exists public.rs5_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null check(char_length(trim(full_name)) between 2 and 90),
 phone text not null check(phone ~ '^[0-9]{8}$'),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.rs5_wallets (
 user_id uuid primary key references auth.users(id) on delete cascade,
 balance_usdt numeric(14,4) not null default 0 check(balance_usdt >= 0),
 updated_at timestamptz not null default now()
);
create table if not exists public.rs5_reseller_memberships (
 user_id uuid primary key references auth.users(id) on delete cascade,
 activated_at timestamptz not null default now(),
 expires_at timestamptz not null
);
create table if not exists public.rs5_plan_requests (
 id bigint generated always as identity primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 plan_price_usdt numeric(14,2) not null,
 plan_days integer not null check(plan_days between 1 and 365),
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 created_at timestamptz not null default now()
);
create unique index if not exists rs5_plan_one_pending on public.rs5_plan_requests(user_id) where status='pending';

create table if not exists public.rs5_orders (
 id uuid primary key default gen_random_uuid(),
 code text not null unique,
 user_id uuid not null references auth.users(id) on delete cascade,
 client_request_id uuid not null,
 game_id text not null references public.rs5_games(id),
 offer_id uuid not null references public.rs5_offers(id),
 game_name text not null,
 offer_name text not null,
 player_id text not null,
 zone_id text,
 method text not null check(method in ('mobile','wallet','card')),
 source_phone text,
 amount numeric(14,2) not null check(amount > 0),
 currency text not null check(currency in ('SM','CUP')),
 receipt_path text,
 status text not null default 'uploading' check(status in ('uploading','pending','completed','rejected')),
 admin_note text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(user_id,client_request_id)
);
create index if not exists rs5_orders_user_idx on public.rs5_orders(user_id,created_at desc);
create index if not exists rs5_orders_status_idx on public.rs5_orders(status,created_at desc);

-- Private receipts: not publicly accessible; all uploads/downloads go through
-- authenticated backend routes with server-side validation.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('rs5-receipts','rs5-receipts',false,3145728,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=3145728,allowed_mime_types=excluded.allowed_mime_types;

-- Data API defense in depth: public catalog is served via a filtered backend,
-- not direct queries; user tables allow only own SELECT, never client writes.
alter table public.rs5_games enable row level security;
alter table public.rs5_offers enable row level security;
alter table public.rs5_settings enable row level security;
alter table public.rs5_profiles enable row level security;
alter table public.rs5_orders enable row level security;
alter table public.rs5_wallets enable row level security;
alter table public.rs5_reseller_memberships enable row level security;
alter table public.rs5_plan_requests enable row level security;
revoke all on public.rs5_games,public.rs5_offers,public.rs5_settings,public.rs5_profiles,public.rs5_orders,public.rs5_wallets,public.rs5_reseller_memberships,public.rs5_plan_requests from anon,authenticated;
grant select on public.rs5_profiles,public.rs5_orders,public.rs5_wallets,public.rs5_reseller_memberships,public.rs5_plan_requests to authenticated;
create policy rs5_profiles_owner_select on public.rs5_profiles for select to authenticated using ((select auth.uid())=user_id);
create policy rs5_orders_owner_select on public.rs5_orders for select to authenticated using ((select auth.uid())=user_id);
create policy rs5_wallets_owner_select on public.rs5_wallets for select to authenticated using ((select auth.uid())=user_id);
create policy rs5_reseller_owner_select on public.rs5_reseller_memberships for select to authenticated using ((select auth.uid())=user_id);
create policy rs5_plans_owner_select on public.rs5_plan_requests for select to authenticated using ((select auth.uid())=user_id);

-- Initial catalog game placeholders: *not* real RecargasAmérica products.
insert into public.rs5_games(id,name,category,featured,sort_order) values
 ('free-fire','Free Fire','Battle Royale',true,1),
 ('roblox','Roblox','Plataformas',true,2),
 ('mobile-legends','Mobile Legends','MOBA',true,3),
 ('pubg','PUBG Mobile','Battle Royale',false,4),
 ('cod','Call of Duty Mobile','Acción',false,5),
 ('honor','Honor of Kings','MOBA',false,6)
on conflict(id) do nothing;

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