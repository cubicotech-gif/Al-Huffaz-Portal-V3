-- 0004_storage_buckets.sql
-- Storage buckets used by the portal, plus RLS policies on storage.objects.

-- student-photos: admin + staff write; authenticated read (sponsors need to
-- see photos of students they sponsor; RLS on students filters linkage).
-- Public is not allowed to read, but the landing-page public view does not
-- include the photo_url column for unauthenticated users.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'student-photos',
  'student-photos',
  false,
  2 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;


-- storage policies --------------------------------------------------------

create policy student_photos_read_authenticated
  on storage.objects for select
  to authenticated
  using (bucket_id = 'student-photos');

create policy student_photos_write_staff
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'student-photos'
    and is_staff_or_admin()
  );

create policy student_photos_update_staff
  on storage.objects for update
  to authenticated
  using (bucket_id = 'student-photos' and is_staff_or_admin())
  with check (bucket_id = 'student-photos' and is_staff_or_admin());

create policy student_photos_delete_staff
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'student-photos' and is_staff_or_admin());
