'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

async function notify(userId: string, title: string, message: string, relatedType?: string, relatedId?: string) {
  const supabase = await createClient();
  await supabase.from('notifications').insert({
    user_id: userId,
    title,
    message,
    type: 'info',
    related_type: relatedType ?? null,
    related_id: relatedId ?? null,
  });
}

export async function approveSponsorAction(profileId: string, _formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: target } = await supabase
    .from('profiles')
    .select('full_name, phone, country, whatsapp, role')
    .eq('id', profileId)
    .single();
  if (!target) throw new Error('Profile not found');
  if (target.role !== 'pending_sponsor') throw new Error('This account is not pending approval');

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: 'sponsor', approved_at: new Date().toISOString(), approved_by: user.id })
    .eq('id', profileId);
  if (profileError) throw new Error(profileError.message);

  // Pull the auth email via the profiles → auth.users chain isn't directly
  // readable from RLS; take the email from the current auth admin API via
  // a simple select on a sibling table instead. For MVP we look it up via
  // the session token as an admin — simplest is to store email on the
  // sponsors row from profile metadata. We fall back to an empty string.
  const email = await resolveEmail(profileId);

  const { error: sponsorError } = await supabase.from('sponsors').insert({
    profile_id: profileId,
    display_name: target.full_name,
    email,
    phone: target.phone,
    whatsapp: target.whatsapp,
    country: target.country,
    approved_at: new Date().toISOString(),
  });
  if (sponsorError) throw new Error(sponsorError.message);

  await notify(
    profileId,
    'Your sponsor account has been approved',
    'Welcome! You can now browse students and submit sponsorship requests.',
    'sponsor',
    profileId,
  );

  revalidatePath('/admin/sponsors/pending');
  revalidatePath('/admin');
}

export async function rejectSponsorAction(profileId: string, _formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('profiles')
    .update({ is_active: false })
    .eq('id', profileId)
    .eq('role', 'pending_sponsor');
  if (error) throw new Error(error.message);

  revalidatePath('/admin/sponsors/pending');
}

async function resolveEmail(profileId: string): Promise<string> {
  // Supabase JS RLS exposes auth.users via the admin API only. For MVP we
  // require the env var SUPABASE_SERVICE_ROLE_KEY to be present and fall
  // back to an empty string if missing. Configuring the service role key
  // in Cloudflare Pages unlocks this lookup.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return '';
  const res = await fetch(`${url}/auth/v1/admin/users/${profileId}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: 'no-store',
  });
  if (!res.ok) return '';
  const json = (await res.json()) as { email?: string };
  return json.email ?? '';
}
