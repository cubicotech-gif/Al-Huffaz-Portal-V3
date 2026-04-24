'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type StaffFormState = { error?: string; info?: string };

async function findUserIdByEmail(email: string): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase service role key is not configured.');

  // The Admin API's list endpoint doesn't expose reliable email filtering,
  // so paginate with a reasonable per_page until we find the match or run
  // out of users. At MVP scale (tens of users) one page is enough.
  const target = email.toLowerCase();
  const perPage = 200;
  for (let page = 1; page <= 25; page += 1) {
    const res = await fetch(`${url}/auth/v1/admin/users?page=${page}&per_page=${perPage}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { users?: { id: string; email?: string }[] };
    const users = json.users ?? [];
    const match = users.find((u) => (u.email ?? '').toLowerCase() === target);
    if (match) return match.id;
    if (users.length < perPage) return null;
  }
  return null;
}

export async function grantStaffAction(
  _prev: StaffFormState,
  formData: FormData,
): Promise<StaffFormState> {
  const emailRaw = String(formData.get('email') ?? '').trim().toLowerCase();
  if (!emailRaw) return { error: 'Email is required.' };

  let userId: string | null;
  try {
    userId = await findUserIdByEmail(emailRaw);
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Lookup failed.' };
  }
  if (!userId) return { error: `No user found with email ${emailRaw}.` };

  const supabase = await createClient();
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', userId)
    .single();
  if (!targetProfile) return { error: 'User exists but has no profile row.' };
  if (targetProfile.role === 'admin') {
    return { error: 'Cannot change an admin account from this screen.' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role: 'staff', is_active: true })
    .eq('id', userId);
  if (error) return { error: error.message };

  revalidatePath('/admin/staff');
  return { info: `${targetProfile.full_name} is now staff.` };
}

export async function revokeStaffAction(profileId: string, _formData: FormData) {
  const supabase = await createClient();
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', profileId)
    .single();
  if (!targetProfile) throw new Error('Profile not found');
  if (targetProfile.role !== 'staff') throw new Error('Only staff accounts can be revoked here.');

  // Revoking staff → deactivate the account. The admin can reassign a role
  // manually via SQL later if needed.
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: false })
    .eq('id', profileId);
  if (error) throw new Error(error.message);

  revalidatePath('/admin/staff');
}
