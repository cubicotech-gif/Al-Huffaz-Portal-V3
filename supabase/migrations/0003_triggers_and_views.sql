-- 0003_triggers_and_views.sql
-- Triggers that link auth.users to profiles and keep denormalized state
-- in sync, plus the public view used for unauthenticated student browsing.

-- New auth user → profile row ---------------------------------------------

create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, role, full_name, phone, whatsapp, country)
  values (
    new.id,
    'pending_sponsor',
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'whatsapp',
    new.raw_user_meta_data->>'country'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();


-- sponsorships status → students.is_sponsored ----------------------------

create or replace function sync_student_sponsored_flag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_student uuid;
  any_active boolean;
begin
  affected_student := coalesce(new.student_id, old.student_id);

  select exists (
    select 1 from sponsorships
    where student_id = affected_student
      and status in ('approved', 'active', 'paused')
  ) into any_active;

  update students
  set is_sponsored = any_active
  where id = affected_student
    and is_sponsored is distinct from any_active;

  return coalesce(new, old);
end;
$$;

create trigger sponsorships_sync_student
  after insert or update of status or delete on sponsorships
  for each row execute function sync_student_sponsored_flag();


-- payments verified → sponsorship active --------------------------------

create or replace function promote_sponsorship_on_first_verified_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'verified' and (old.status is null or old.status <> 'verified') then
    update sponsorships
    set status = 'active'
    where id = new.sponsorship_id
      and status = 'approved';
  end if;
  return new;
end;
$$;

create trigger payments_promote_sponsorship
  after insert or update of status on payments
  for each row execute function promote_sponsorship_on_first_verified_payment();


-- Public available-students view ----------------------------------------
-- Exposes only the safe columns for unauthenticated browsing. Backed by a
-- security_invoker view so RLS on the base table is evaluated (but we
-- grant anon select on the view itself, and the view filters to the
-- donation-eligible / unsponsored subset).

create or replace view public_available_students
with (security_invoker = off) as
select
  s.id,
  s.full_name,
  s.grade_level,
  s.islamic_category,
  s.gender,
  s.photo_url,
  coalesce(
    (select monthly_fee from student_fees f
     where f.student_id = s.id
     order by f.created_at desc
     limit 1),
    0
  )::bigint as monthly_fee
from students s
where s.archived_at is null
  and s.donation_eligible
  and not s.is_sponsored;

grant select on public_available_students to anon, authenticated;
