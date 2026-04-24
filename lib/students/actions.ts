'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SCHOOL_ID, studentFormSchema } from '@/lib/students/schema';
import type { StudentFormState } from '@/components/student-form';

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

async function uploadPhoto(file: File, studentId: string): Promise<string> {
  const supabase = await createClient();
  if (!ALLOWED_PHOTO_TYPES.has(file.type)) {
    throw new Error('Photo must be a JPEG, PNG, or WebP image.');
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error('Photo must be under 2 MB.');
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${studentId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('student-photos')
    .upload(path, file, { contentType: file.type, upsert: true });
  if (error) throw new Error(error.message);
  return path;
}

export async function createStudentAction(
  _prev: StudentFormState,
  formData: FormData,
): Promise<StudentFormState> {
  const parsed = studentFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path.join('.')] = issue.message;
    }
    return { error: 'Please fix the highlighted fields.', fieldErrors };
  }

  const supabase = await createClient();
  const { data: inserted, error: insertError } = await supabase
    .from('students')
    .insert({ school_id: SCHOOL_ID, ...parsed.data })
    .select('id')
    .single();

  if (insertError || !inserted) {
    return { error: insertError?.message ?? 'Failed to create student.' };
  }

  const photo = formData.get('photo');
  if (photo instanceof File && photo.size > 0) {
    try {
      const path = await uploadPhoto(photo, inserted.id);
      await supabase.from('students').update({ photo_url: path }).eq('id', inserted.id);
    } catch (err) {
      return {
        error: `Student saved, but photo upload failed: ${
          err instanceof Error ? err.message : 'unknown error'
        }. You can retry on the edit page.`,
      };
    }
  }

  revalidatePath('/admin/students');
  redirect(`/admin/students/${inserted.id}`);
}

export async function updateStudentAction(
  id: string,
  _prev: StudentFormState,
  formData: FormData,
): Promise<StudentFormState> {
  const parsed = studentFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path.join('.')] = issue.message;
    }
    return { error: 'Please fix the highlighted fields.', fieldErrors };
  }

  const supabase = await createClient();
  let photoPath: string | undefined;

  const photo = formData.get('photo');
  if (photo instanceof File && photo.size > 0) {
    try {
      photoPath = await uploadPhoto(photo, id);
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Photo upload failed.' };
    }
  }

  const { error } = await supabase
    .from('students')
    .update({ ...parsed.data, ...(photoPath ? { photo_url: photoPath } : {}) })
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/admin/students');
  revalidatePath(`/admin/students/${id}`);
  return { savedAt: Date.now() };
}

export async function archiveStudentAction(id: string, _formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('students')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/students');
  redirect('/admin/students');
}

export async function restoreStudentAction(id: string, _formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from('students').update({ archived_at: null }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/students');
  revalidatePath(`/admin/students/${id}`);
}
