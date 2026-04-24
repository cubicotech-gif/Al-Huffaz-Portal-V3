-- 0008_student_form_cleanup.sql
-- Drops fields removed from the v3 admission form during the v2 UI
-- reconciliation pass.

-- father_phone — v2 admission form keeps only father email/name/CNIC in
-- the family block. Phone numbers are captured via guardian + emergency.
alter table students drop column if exists father_phone;
