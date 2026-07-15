-- 0012_sponsorship_types.sql
-- Module 2: sponsorship type (monthly/quarterly/yearly) + computed amounts.
--
-- 1) Expose the fee line-items on the public available-students view so the
--    student page and the request action can compute plan amounts without
--    opening the staff-only student_fees table to sponsors.
-- 2) Record the chosen plan on the sponsorship: `plan_amount` is the amount
--    payable per instalment of the chosen cycle. `monthly_amount` stays the
--    recurring monthly figure (dashboards sum it as monthly commitment).
--    `sponsorship_type` already exists (default 'monthly') from 0001.

alter table sponsorships
  add column if not exists plan_amount bigint;

-- Backfill existing rows: plan_amount defaults to the stored monthly amount.
update sponsorships set plan_amount = monthly_amount where plan_amount is null;

create or replace view public_available_students
with (security_invoker = off) as
select
  s.id,
  s.full_name,
  s.grade_level,
  s.islamic_category,
  s.gender,
  s.photo_url,
  coalesce(f.monthly_fee, 0)::bigint   as monthly_fee,
  coalesce(f.course_fee, 0)::bigint    as course_fee,
  coalesce(f.uniform_fee, 0)::bigint   as uniform_fee,
  coalesce(f.annual_fee, 0)::bigint    as annual_fee,
  coalesce(f.admission_fee, 0)::bigint as admission_fee
from students s
left join lateral (
  select monthly_fee, course_fee, uniform_fee, annual_fee, admission_fee
  from student_fees
  where student_id = s.id
  order by created_at desc
  limit 1
) f on true
where s.archived_at is null
  and s.donation_eligible
  and not s.is_sponsored;

grant select on public_available_students to anon, authenticated;
