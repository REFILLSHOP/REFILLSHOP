-- Refills Shop V10: profile phone may belong to any supported country.
-- Allows E.164 (+CCXXXXXXXX) and legacy Cuban 8-digit numbers for migration.
-- The registration flow saves canonical E.164 for all NEW users.
alter table public.rs5_profiles drop constraint if exists rs5_profiles_phone_check;
alter table public.rs5_profiles add constraint rs5_profiles_phone_check
 check (phone ~ '^[+][1-9][0-9]{7,14}$' or phone ~ '^5[0-9]{7}$');
create unique index if not exists rs5_profiles_phone_unique on public.rs5_profiles(phone);