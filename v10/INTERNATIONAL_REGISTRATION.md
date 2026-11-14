# International registration — Refills Shop V10

## Implemented
- Visitors choose a country calling code (or enter another code), and their national phone.
- The backend validates an explicit E.164-format number and creates the Supabase Auth user with a private technical alias; it never claims to have verified the phone.
- Legacy Cuban technical aliases (`cu53...@refillshop.pages.dev`) are preserved for older accounts. Other countries use `tel<countrycode><nationalnumber>@refillshop.pages.dev`. This alias is NOT a deliverable email and must not be used for password recovery.
- The user's phone is stored in the private `rs5_profiles` row. No SMS or email is sent during signup; passwords must be kept safely.
- Cuba card, mobile top-up and MiTransfer are *payment methods*, not a country restriction for registration. The checkout explains these are currently Cuba-only methods; **international payment collection is not implemented**.
- Unique profile phone index, 5 signup attempts/hour/IP rate limit (in-memory: use a persistent rate-limiter before broad production scale), and ownership-sensitive operations must not rely on an unverified phone.

## Pending for real production
- Configure a running Node 22+ host and private SUPABASE_SECRET_KEY, not on Pages/Worker public JS.
- Add verified ownership and secure recovery via a real SMS provider and/or a separate verified email flow. It is not safe to auto-send reset links to synthetic aliases.
- Add international payment processor(s) and region-specific pricing where supported, with legal and sanctions compliance checks. Do not enable payments or purchases until tested.
- Implement strong persistent account recovery and multi-instance rate-limiting before customer onboarding at scale.

## Database
Apply `migration_international_phone.sql` to the correct Supabase project before enabling registration.

## Tests
`node --test tests/*.test.js` checks phone normalization, international alias compatibility, signup limits and routes.