-- 0005_phase3_policies.sql
-- Additional RLS policies needed once sponsor approvals, sponsorship
-- approvals, and rejection flows start writing notifications from
-- authenticated admin sessions (instead of only via service_role).

-- Allow staff/admin to insert notifications for any user (e.g. notify a
-- sponsor that their request was approved).
create policy notifications_insert_staff
  on notifications for insert
  to authenticated
  with check (is_staff_or_admin());

-- Allow authenticated users to read their own auth email via the profile
-- row is already covered. Nothing else to change here.
