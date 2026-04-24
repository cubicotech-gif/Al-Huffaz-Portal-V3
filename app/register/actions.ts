'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type RegisterState = { error?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function registerAction(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const fullName = String(formData.get('full_name') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const country = String(formData.get('country') ?? '').trim();
  const whatsapp = String(formData.get('whatsapp') ?? '').trim();

  if (!EMAIL_RE.test(email)) return { error: 'Enter a valid email address.' };
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' };
  if (!fullName) return { error: 'Full name is required.' };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone: phone || null,
        country: country || null,
        whatsapp: whatsapp || null,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }
  if (!data.user) {
    return { error: 'Unable to create account. Please try again.' };
  }

  redirect('/pending-approval');
}
