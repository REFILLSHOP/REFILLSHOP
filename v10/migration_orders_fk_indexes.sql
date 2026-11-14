-- Performance indexes applied to Supabase project kcgjlnymhmxylrjchcvl on 2026-11-14.
-- Cover the rs5_orders foreign keys used by admin/customer filters and joins.
create index if not exists rs5_orders_game_id_idx on public.rs5_orders(game_id);
create index if not exists rs5_orders_offer_id_idx on public.rs5_orders(offer_id);