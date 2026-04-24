'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/resend';

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

export async function pauseSponsorAction(id: string, _formData: FormData) {
  const supabase = await createClient();
  const { data: sponsor, error: readError } = await supabase
    .from('sponsors')
    .select('profile_id, account_status')
    .eq('id', id)
    .single();
  if (readError || !sponsor) throw new Error(readError?.message ?? 'Sponsor not found');
  if (sponsor.account_status !== 'active') throw new Error('Only active sponsors can be paused.');

  const { error } = await supabase
    .from('sponsors')
    .update({ account_status: 'paused' })
    .eq('id', id);
  if (error) throw new Error(error.message);

  await notify(
    sponsor.profile_id,
    'Your account has been paused',
    'An administrator has paused your sponsor account. Contact support if you believe this is in error.',
  );

  revalidatePath('/admin/sponsors');
  revalidatePath(`/admin/sponsors/${id}`);
}

export async function reactivateSponsorAction(id: string, _formData: FormData) {
  const supabase = await createClient();
  const { data: sponsor, error: readError } = await supabase
    .from('sponsors')
    .select('profile_id, account_status')
    .eq('id', id)
    .single();
  if (readError || !sponsor) throw new Error(readError?.message ?? 'Sponsor not found');
  if (sponsor.account_status === 'active') return;

  const { error } = await supabase
    .from('sponsors')
    .update({
      account_status: 'active',
      reactivated_at: new Date().toISOString(),
      account_deleted_at: null,
    })
    .eq('id', id);
  if (error) throw new Error(error.message);

  await supabase
    .from('profiles')
    .update({ is_active: true })
    .eq('id', sponsor.profile_id);

  await notify(
    sponsor.profile_id,
    'Your account has been reactivated',
    'Welcome back. You can now resume sponsoring students.',
  );

  revalidatePath('/admin/sponsors');
  revalidatePath(`/admin/sponsors/${id}`);
}

export async function deleteSponsorAction(id: string, _formData: FormData) {
  const supabase = await createClient();
  const { data: sponsor, error: readError } = await supabase
    .from('sponsors')
    .select('profile_id, display_name, account_status')
    .eq('id', id)
    .single();
  if (readError || !sponsor) throw new Error(readError?.message ?? 'Sponsor not found');
  if (sponsor.account_status === 'deleted') return;

  // End any open sponsorships — keep history.
  await supabase
    .from('sponsorships')
    .update({ status: 'cancelled', ended_at: new Date().toISOString(), cancelled_at: new Date().toISOString() })
    .eq('sponsor_id', id)
    .in('status', ['requested', 'approved', 'active', 'paused']);

  const now = new Date().toISOString();
  const { error } = await supabase
    .from('sponsors')
    .update({ account_status: 'deleted', account_deleted_at: now })
    .eq('id', id);
  if (error) throw new Error(error.message);

  await supabase
    .from('profiles')
    .update({ is_active: false })
    .eq('id', sponsor.profile_id);

  revalidatePath('/admin/sponsors');
  revalidatePath(`/admin/sponsors/${id}`);
}

export async function reengageSponsorAction(id: string, _formData: FormData) {
  const supabase = await createClient();
  const { data: sponsor } = await supabase
    .from('sponsors')
    .select('profile_id, display_name, email')
    .eq('id', id)
    .single();
  if (!sponsor) throw new Error('Sponsor not found');

  await notify(
    sponsor.profile_id,
    'We miss you',
    "It's been a while. We'd love to have you sponsoring students again.",
  );

  if (sponsor.email) {
    await sendEmail({
      to: sponsor.email,
      subject: 'We miss you — Al-Huffaz Education Portal',
      text: `Hi ${sponsor.display_name},\n\nIt's been a while since we heard from you. If you'd like to resume sponsoring a student, sign in at your dashboard whenever you're ready.\n\nThank you for supporting Al-Huffaz.`,
    });
  }

  revalidatePath(`/admin/sponsors/${id}`);
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
