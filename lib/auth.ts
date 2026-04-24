import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ROLE_HOME, type UserRole } from '@/lib/types';

export async function getSessionProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name, is_active')
    .eq('id', user.id)
    .single();

  if (!profile) return null;
  return { user, profile: profile as { id: string; role: UserRole; full_name: string; is_active: boolean } };
}

export async function requireRole(allowed: UserRole[]) {
  const session = await getSessionProfile();
  if (!session) redirect('/login');

  const { profile } = session;
  if (!profile.is_active) redirect('/login');
  if (!allowed.includes(profile.role)) {
    redirect(ROLE_HOME[profile.role]);
  }

  return session;
}
