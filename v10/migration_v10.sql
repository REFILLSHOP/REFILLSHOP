-- Applied to Supabase project kcgjlnymhmxylrjchcvl on 2026-11-11.
-- Adds server-only supplier-fulfilment state, idempotency and audit trail.
-- Safe to run on another database after schema.sql and migration_v7.sql.
create table if not exists public.rs5_fulfillments (
 order_id uuid primary key references public.rs5_orders(id) on delete restrict,
 provider text not null default 'centralone' check(provider='centralone'),
 idempotency_key text not null unique,
 product_key uuid not null,
 status text not null default 'prepared' check(status in ('prepared','submitted','needs_review','completed','failed')),
 provider_order_id uuid,
 provider_reference text,
 provider_status text,
 error_code text,
 response_excerpt jsonb,
 payment_confirmed_at timestamptz not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists rs5_fulfillments_status_idx on public.rs5_fulfillments(status,created_at desc);
create table if not exists public.rs5_admin_audit (
 id bigint generated always as identity primary key,
 operation text not null,
 target_type text not null,
 target_id text,
 details jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create index if not exists rs5_admin_audit_created_idx on public.rs5_admin_audit(created_at desc);
alter table public.rs5_fulfillments enable row level security;
alter table public.rs5_admin_audit enable row level security;
revoke all on public.rs5_fulfillments,public.rs5_admin_audit from anon,authenticated;