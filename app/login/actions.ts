'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ROLE_HOME, type UserRole } from '@/lib/types';

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const next = String(formData.get('next') ?? '');

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = await createClient();
  const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !authData.user) {
    return { error: 'Invalid email or password.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', authData.user.id)
    .single();

  if (!profile) {
    await supabase.auth.signOut();
    return { error: 'Account not found. Please contact support.' };
  }
  if (!profile.is_active) {
    await supabase.auth.signOut();
    return { error: 'This account has been deactivated.' };
  }

  const destination = next && next.startsWith('/') ? next : ROLE_HOME[profile.role as UserRole];
  redirect(destination);
}
