'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/activity';

export type RequestSponsorshipState = { error?: string; requestedAt?: number };

async function notify(
  userId: string,
  title: string,
  message: string,
  relatedId: string,
) {
  const supabase = await createClient();
  await supabase.from('notifications').insert({
    user_id: userId,
    title,
    message,
    type: 'info',
    related_type: 'sponsorship',
    related_id: relatedId,
  });
}

export async function requestSponsorshipAction(
  studentId: string,
  _prev: RequestSponsorshipState,
  _formData: FormData,
): Promise<RequestSponsorshipState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/students/${studentId}`)}`);

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!profile) return { error: 'Your profile could not be found.' };
  if (profile.role === 'pending_sponsor') {
    return {
      error:
        'Your sponsor account is still pending admin approval. You can submit a request once approved.',
    };
  }
  if (profile.role !== 'sponsor') {
    return { error: 'Only sponsors can request sponsorships.' };
  }

  const { data: sponsor } = await supabase
    .from('sponsors')
    .select('id')
    .eq('profile_id', user.id)
    .single();
  if (!sponsor) return { error: 'No sponsor record found for your account. Contact support.' };

  const { data: student } = await supabase
    .from('public_available_students')
    .select('id, monthly_fee')
    .eq('id', studentId)
    .single();
  if (!student) {
    return { error: 'This student is no longer available for sponsorship.' };
  }

  const { data: existing } = await supabase
    .from('sponsorships')
    .select('id, status')
    .eq('sponsor_id', sponsor.id)
    .eq('student_id', studentId)
    .in('status', ['requested', 'approved', 'active', 'paused'])
    .maybeSingle();
  if (existing) {
    return { error: 'You already have an open request for this student.' };
  }

  const { error } = await supabase.from('sponsorships').insert({
    sponsor_id: sponsor.id,
    student_id: studentId,
    monthly_amount: student.monthly_fee ?? 0,
    status: 'requested',
  });
  if (error) return { error: error.message };

  await logActivity({
    action: 'sponsorship.requested',
    objectType: 'sponsorship',
    objectId: studentId,
    details: { student_id: studentId, sponsor_id: sponsor.id },
  });

  revalidatePath(`/students/${studentId}`);
  revalidatePath('/admin/sponsorships');
  revalidatePath('/sponsor');
  revalidatePath('/sponsor/students');
  return { requestedAt: Date.now() };
}

export async function approveSponsorshipAction(id: string, _formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: row, error: readError } = await supabase
    .from('sponsorships')
    .select('id, status, student_id, sponsor_id, sponsors!inner(profile_id)')
    .eq('id', id)
    .single();
  if (readError || !row) throw new Error(readError?.message ?? 'Sponsorship not found');
  if (row.status !== 'requested') throw new Error('Only requested sponsorships can be approved.');

  const { error } = await supabase
    .from('sponsorships')
    .update({ status: 'approved', approved_at: new Date().toISOString(), approved_by: user.id })
    .eq('id', id);
  if (error) throw new Error(error.message);

  const sponsorProfileId = (row as unknown as { sponsors: { profile_id: string } }).sponsors.profile_id;
  await notify(
    sponsorProfileId,
    'Sponsorship approved',
    'Your sponsorship request has been approved. Submit your first payment to activate it.',
    id,
  );

  await logActivity({ action: 'sponsorship.approved', objectType: 'sponsorship', objectId: id });

  revalidatePath('/admin/sponsorships');
  revalidatePath('/sponsor');
  revalidatePath('/sponsor/students');
}

export async function rejectSponsorshipAction(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const reason = String(formData.get('reason') ?? '').trim() || null;

  const { data: row } = await supabase
    .from('sponsorships')
    .select('id, status, sponsors!inner(profile_id)')
    .eq('id', id)
    .single();
  if (!row) throw new Error('Sponsorship not found');
  if (row.status !== 'requested') throw new Error('Only requested sponsorships can be rejected.');

  const { error } = await supabase
    .from('sponsorships')
    .update({
      status: 'rejected',
      rejected_at: new Date().toISOString(),
      rejected_by: user.id,
      rejection_reason: reason,
    })
    .eq('id', id);
  if (error) throw new Error(error.message);

  const sponsorProfileId = (row as unknown as { sponsors: { profile_id: string } }).sponsors.profile_id;
  await notify(
    sponsorProfileId,
    'Sponsorship request declined',
    reason ?? 'Your sponsorship request was declined. You can request a different student.',
    id,
  );

  await logActivity({
    action: 'sponsorship.rejected',
    objectType: 'sponsorship',
    objectId: id,
    details: { reason },
  });

  revalidatePath('/admin/sponsorships');
  revalidatePath('/sponsor');
}
