'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { parseCsv } from '@/lib/csv';
import { SCHOOL_ID, studentFormSchema } from '@/lib/students/schema';
import { logActivity } from '@/lib/activity';

export type ImportState = {
  error?: string;
  summary?: {
    total: number;
    inserted: number;
    errors: { row: number; name: string; message: string }[];
  };
};

function boolish(v: string | undefined): string {
  if (v == null) return '';
  const s = v.trim().toLowerCase();
  if (s === 'true' || s === 'yes' || s === '1') return 'on';
  return '';
}

export async function importStudentsAction(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const file = formData.get('csv');
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Choose a CSV file.' };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: 'CSV is too large (max 5 MB).' };
  }

  const text = await file.text();
  const { rows } = parseCsv(text);
  if (rows.length === 0) return { error: 'CSV appears to be empty.' };

  const supabase = await createClient();
  const errors: { row: number; name: string; message: string }[] = [];
  let inserted = 0;

  for (let idx = 0; idx < rows.length; idx += 1) {
    const raw = rows[idx];
    const normalized: Record<string, string> = { ...raw };
    if ('zakat_eligible' in raw) normalized.zakat_eligible = boolish(raw.zakat_eligible);
    if ('donation_eligible' in raw) normalized.donation_eligible = boolish(raw.donation_eligible);

    const parsed = studentFormSchema.safeParse(normalized);
    if (!parsed.success) {
      errors.push({
        row: idx + 2, // header is row 1
        name: raw.full_name ?? '',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      });
      continue;
    }

    const { error } = await supabase
      .from('students')
      .insert({ school_id: SCHOOL_ID, ...parsed.data });
    if (error) {
      errors.push({
        row: idx + 2,
        name: parsed.data.full_name,
        message: error.message,
      });
      continue;
    }
    inserted += 1;
  }

  revalidatePath('/admin/students');
  await logActivity({
    action: 'import.students',
    objectType: 'students',
    details: { inserted, errors: errors.length, total: rows.length },
  });

  return { summary: { total: rows.length, inserted, errors } };
}
