-- Refills Shop V10: no two profiles may claim the same Cuba phone number.
-- Applied to project kcgjlnymhmxylrjchcvl on Nov 14, 2026.
-- Confirm preexisting phone data has no duplicates before applying elsewhere.
create unique index if not exists rs5_profiles_phone_unique on public.rs5_profiles(phone);