-- 0002_rls_policies.sql
-- Row Level Security policies for every table.
-- Convention: one policy per (table, operation, subject) combination,
-- named `<table>_<op>_<subject>`.

-- Helper functions ---------------------------------------------------------
-- These read the caller's role from `profiles`. Kept `stable` so Postgres
-- can cache within a statement; marked `security definer` so they bypass
-- RLS on `profiles` itself (to avoid recursion in policies).

create or replace function auth_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from profiles where id = auth.uid()) = 'admin', false);
$$;

create or replace function is_staff_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from profiles where id = auth.uid()) in ('admin', 'staff'), false);
$$;

create or replace function is_sponsor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from profiles where id = auth.uid()) = 'sponsor', false);
$$;

create or replace function current_sponsor_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from sponsors where profile_id = auth.uid();
$$;


-- Enable RLS on every table ------------------------------------------------

alter table profiles           enable row level security;
alter table schools            enable row level security;
alter table students           enable row level security;
alter table student_fees       enable row level security;
alter table student_attendance enable row level security;
alter table student_academics  enable row level security;
alter table student_behavior   enable row level security;
alter table sponsors           enable row level security;
alter table sponsorships       enable row level security;
alter table payments           enable row level security;
alter table notifications      enable row level security;
alter table activity_log       enable row level security;


-- profiles -----------------------------------------------------------------

create policy profiles_select_self_or_admin
  on profiles for select
  to authenticated
  using (id = auth.uid() or is_staff_or_admin());

create policy profiles_update_self
  on profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy profiles_update_admin
  on profiles for update
  to authenticated
  using (is_admin())
  with check (is_admin());


-- schools ------------------------------------------------------------------

create policy schools_select_all
  on schools for select
  to authenticated
  using (true);

create policy schools_write_admin
  on schools for all
  to authenticated
  using (is_admin())
  with check (is_admin());


-- students -----------------------------------------------------------------
-- Admin/staff: full access.
-- Sponsor: select only students they sponsor via an approved or active sponsorship.
-- Public browsing uses the `public_available_students` view (0003 migration).

create policy students_select_staff
  on students for select
  to authenticated
  using (is_staff_or_admin());

create policy students_select_linked_sponsor
  on students for select
  to authenticated
  using (
    is_sponsor()
    and exists (
      select 1 from sponsorships s
      where s.student_id = students.id
        and s.sponsor_id = current_sponsor_id()
        and s.status in ('approved', 'active', 'paused')
    )
  );

create policy students_write_staff
  on students for all
  to authenticated
  using (is_staff_or_admin())
  with check (is_staff_or_admin());


-- per-term student tables: admin/staff only for now ----------------------

create policy student_fees_all_staff
  on student_fees for all
  to authenticated
  using (is_staff_or_admin())
  with check (is_staff_or_admin());

create policy student_attendance_all_staff
  on student_attendance for all
  to authenticated
  using (is_staff_or_admin())
  with check (is_staff_or_admin());

create policy student_academics_all_staff
  on student_academics for all
  to authenticated
  using (is_staff_or_admin())
  with check (is_staff_or_admin());

create policy student_behavior_all_staff
  on student_behavior for all
  to authenticated
  using (is_staff_or_admin())
  with check (is_staff_or_admin());


-- sponsors -----------------------------------------------------------------

create policy sponsors_select_self
  on sponsors for select
  to authenticated
  using (profile_id = auth.uid());

create policy sponsors_select_admin
  on sponsors for select
  to authenticated
  using (is_staff_or_admin());

create policy sponsors_write_admin
  on sponsors for all
  to authenticated
  using (is_admin())
  with check (is_admin());


-- sponsorships -------------------------------------------------------------

create policy sponsorships_select_self
  on sponsorships for select
  to authenticated
  using (sponsor_id = current_sponsor_id());

create policy sponsorships_select_staff
  on sponsorships for select
  to authenticated
  using (is_staff_or_admin());

create policy sponsorships_insert_self
  on sponsorships for insert
  to authenticated
  with check (
    is_sponsor()
    and sponsor_id = current_sponsor_id()
    and status = 'requested'
  );

create policy sponsorships_update_self_cancel
  on sponsorships for update
  to authenticated
  using (sponsor_id = current_sponsor_id())
  with check (
    sponsor_id = current_sponsor_id()
    and status in ('cancelled', 'requested')
  );

create policy sponsorships_update_admin
  on sponsorships for update
  to authenticated
  using (is_staff_or_admin())
  with check (is_staff_or_admin());


-- payments -----------------------------------------------------------------

create policy payments_select_self
  on payments for select
  to authenticated
  using (sponsor_id = current_sponsor_id());

create policy payments_select_staff
  on payments for select
  to authenticated
  using (is_staff_or_admin());

create policy payments_insert_self
  on payments for insert
  to authenticated
  with check (
    is_sponsor()
    and sponsor_id = current_sponsor_id()
    and status = 'submitted'
    and exists (
      select 1 from sponsorships s
      where s.id = payments.sponsorship_id
        and s.sponsor_id = current_sponsor_id()
    )
  );

create policy payments_update_admin
  on payments for update
  to authenticated
  using (is_staff_or_admin())
  with check (is_staff_or_admin());


-- notifications ------------------------------------------------------------

create policy notifications_select_self
  on notifications for select
  to authenticated
  using (user_id = auth.uid());

create policy notifications_update_self
  on notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Inserts to notifications are performed by server-side code using the
-- service_role key, which bypasses RLS by design.


-- activity_log -------------------------------------------------------------

create policy activity_log_select_admin
  on activity_log for select
  to authenticated
  using (is_admin());

-- Inserts are server-side only (service_role).
