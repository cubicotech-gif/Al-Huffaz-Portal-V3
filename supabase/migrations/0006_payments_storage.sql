-- 0006_payments_storage.sql
-- Private storage bucket for payment proof uploads, plus RLS.
-- Path convention: <sponsor_id>/<timestamp>-<random>.<ext>

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  5 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Sponsor can upload into their own folder (first path segment == their sponsor_id).
create policy payment_proofs_insert_owner
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'payment-proofs'
    and is_sponsor()
    and split_part(name, '/', 1) = current_sponsor_id()::text
  );

-- Sponsor can read their own uploads.
create policy payment_proofs_read_owner
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'payment-proofs'
    and split_part(name, '/', 1) = current_sponsor_id()::text
  );

-- Admin / staff can read any payment proof.
create policy payment_proofs_read_staff
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'payment-proofs'
    and is_staff_or_admin()
  );

-- Admin / staff can delete (e.g. cleanup on rejection).
create policy payment_proofs_delete_staff
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'payment-proofs'
    and is_staff_or_admin()
  );
