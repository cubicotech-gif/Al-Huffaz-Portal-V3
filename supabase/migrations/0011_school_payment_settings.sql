-- 0011_school_payment_settings.sql
-- Module 7: editable bank / transfer instructions shown to sponsors on the
-- payment page (v2 hard-coded [BANK NAME] / [IBAN] placeholders). Plus a
-- master email-notifications toggle used by the notification layer (Module 10).
-- All columns live on the single-school row; admin-only writes are already
-- covered by schools_write_admin (0002).

alter table schools
  add column if not exists bank_name text,
  add column if not exists account_title text,
  add column if not exists account_number text,
  add column if not exists iban text,
  add column if not exists swift_code text,
  add column if not exists payment_instructions text,
  add column if not exists email_notifications_enabled boolean not null default true;
