-- 0007_activity_and_settings.sql
-- Activity log: allow authenticated users to append rows for their own
-- actions. Admin can still select everything via the existing policy.

create policy activity_log_insert_self
  on activity_log for insert
  to authenticated
  with check (actor_id = auth.uid());

-- Schools: authenticated read is already allowed (schools_select_all).
-- Confirm admin can write via the existing schools_write_admin policy.
-- No schema change needed here, but keep this migration as a stable
-- anchor for Phase 6 settings work.
