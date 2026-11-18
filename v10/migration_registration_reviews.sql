-- Admin-only review of new registrations. This is NOT phone ownership verification.
create table if not exists public.rs5_registration_reviews (
 user_id uuid primary key references auth.users(id) on delete cascade,
 status text not null default 'pending' check (status in ('pending','contacted','confirmed')),
 channel text check (channel is null or channel in ('whatsapp','sms','other')),
 updated_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);
alter table public.rs5_registration_reviews enable row level security;
revoke all on public.rs5_registration_reviews from anon,authenticated;
-- Profile inserts come only from server APIs with a private service key; create a pending review automatically.
create or replace function public.rs5_queue_registration_review()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
 insert into public.rs5_registration_reviews(user_id) values (new.user_id)
 on conflict (user_id) do nothing;
 return new;
end;
$$;
drop trigger if exists rs5_queue_registration_review on public.rs5_profiles;
create trigger rs5_queue_registration_review after insert on public.rs5_profiles
 for each row execute function public.rs5_queue_registration_review();
insert into public.rs5_registration_reviews(user_id)
select user_id from public.rs5_profiles on conflict(user_id) do nothing;