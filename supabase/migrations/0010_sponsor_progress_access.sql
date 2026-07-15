-- 0010_sponsor_progress_access.sql
-- Module 4: let an approved/linked sponsor read the academic profile of the
-- child they sponsor (report card, attendance, behaviour). Read-only, and
-- scoped to students the caller actually sponsors via a live sponsorship.
-- Admin/staff keep full access through the existing `_all_staff` policies.
--
-- Mirrors students_select_linked_sponsor from 0002: a sponsorship in
-- 'approved' | 'active' | 'paused' grants visibility; 'requested',
-- 'rejected', 'cancelled' do not.

create or replace function sponsors_linked_student(target_student uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from sponsorships s
    where s.student_id = target_student
      and s.sponsor_id = current_sponsor_id()
      and s.status in ('approved', 'active', 'paused')
  );
$$;

create policy student_academics_select_linked_sponsor
  on student_academics for select
  to authenticated
  using (is_sponsor() and sponsors_linked_student(student_id));

create policy student_attendance_select_linked_sponsor
  on student_attendance for select
  to authenticated
  using (is_sponsor() and sponsors_linked_student(student_id));

create policy student_behavior_select_linked_sponsor
  on student_behavior for select
  to authenticated
  using (is_sponsor() and sponsors_linked_student(student_id));
