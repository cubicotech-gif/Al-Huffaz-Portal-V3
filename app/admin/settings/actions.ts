'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/activity';
import { SCHOOL_ID } from '@/lib/students/schema';

export type SettingsState = { error?: string; savedAt?: number };

function clean(value: FormDataEntryValue | null): string | null {
  const s = typeof value === 'string' ? value.trim() : '';
  return s === '' ? null : s;
}

export async function updateSchoolAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const name = clean(formData.get('name'));
  if (!name) return { error: 'School name is required.' };

  const payload = {
    name,
    email: clean(formData.get('email')),
    phone: clean(formData.get('phone')),
    address: clean(formData.get('address')),
    currency: clean(formData.get('currency')) ?? 'PKR',
    currency_symbol: clean(formData.get('currency_symbol')) ?? 'Rs.',
    academic_year: clean(formData.get('academic_year')),
  };

  const supabase = await createClient();
  const { error } = await supabase.from('schools').update(payload).eq('id', SCHOOL_ID);
  if (error) return { error: error.message };

  await logActivity({
    action: 'settings.updated',
    objectType: 'school',
    objectId: SCHOOL_ID,
    details: payload,
  });

  revalidatePath('/admin/settings');
  return { savedAt: Date.now() };
}
