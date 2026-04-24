'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/resend';
import { logActivity } from '@/lib/activity';
import {
  ALLOWED_PROOF_TYPES,
  MAX_PROOF_BYTES,
  paymentFormSchema,
} from '@/lib/payments/schema';

export type PaymentFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  submittedAt?: number;
};

function extFromMime(mime: string): string {
  switch (mime) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'application/pdf':
      return 'pdf';
    default:
      return 'jpg';
  }
}

async function uploadProof(file: File, sponsorId: string): Promise<string> {
  if (!ALLOWED_PROOF_TYPES.has(file.type)) {
    throw new Error('Proof must be a JPEG, PNG, WebP, or PDF file.');
  }
  if (file.size > MAX_PROOF_BYTES) {
    throw new Error('Proof must be under 5 MB.');
  }
  const supabase = await createClient();
  const path = `${sponsorId}/${Date.now()}-${crypto.randomUUID()}.${extFromMime(file.type)}`;
  const { error } = await supabase.storage
    .from('payment-proofs')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);
  return path;
}

export async function submitPaymentAction(
  _prev: PaymentFormState,
  formData: FormData,
): Promise<PaymentFormState> {
  const parsed = paymentFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path.join('.')] = issue.message;
    }
    return { error: 'Please fix the highlighted fields.', fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: sponsor } = await supabase
    .from('sponsors')
    .select('id')
    .eq('profile_id', user.id)
    .single();
  if (!sponsor) return { error: 'No sponsor record found for your account.' };

  const { data: sponsorship } = await supabase
    .from('sponsorships')
    .select('id, sponsor_id, student_id, status')
    .eq('id', parsed.data.sponsorship_id)
    .single();
  if (!sponsorship) return { error: 'Sponsorship not found.' };
  if (sponsorship.sponsor_id !== sponsor.id) {
    return { error: 'You can only submit payments for your own sponsorships.' };
  }
  if (!['approved', 'active', 'paused'].includes(sponsorship.status)) {
    return {
      error: `Cannot submit payment for a ${sponsorship.status} sponsorship.`,
    };
  }

  const proof = formData.get('proof');
  let proofPath: string | null = null;
  if (proof instanceof File && proof.size > 0) {
    try {
      proofPath = await uploadProof(proof, sponsor.id);
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Proof upload failed.' };
    }
  } else {
    return { error: 'A payment proof (screenshot or PDF) is required.' };
  }

  const amountMinor = Math.round(parsed.data.amount_major * 100);

  const { data: inserted, error: insertError } = await supabase
    .from('payments')
    .insert({
      sponsorship_id: sponsorship.id,
      sponsor_id: sponsor.id,
      student_id: sponsorship.student_id,
      amount: amountMinor,
      payment_method: parsed.data.payment_method,
      bank_name: parsed.data.bank_name,
      transaction_id: parsed.data.transaction_id,
      payment_date: parsed.data.payment_date,
      notes: parsed.data.notes,
      proof_url: proofPath,
      status: 'submitted',
    })
    .select('id')
    .single();

  if (insertError || !inserted) {
    return { error: insertError?.message ?? 'Failed to record payment.' };
  }

  await logActivity({
    action: 'payment.submitted',
    objectType: 'payment',
    objectId: inserted.id,
    details: { amount_minor: amountMinor, sponsorship_id: sponsorship.id },
  });

  revalidatePath('/sponsor/payments');
  revalidatePath('/sponsor/students');
  revalidatePath('/admin/payments');
  redirect('/sponsor/payments?submitted=1');
}

async function loadAdminContext(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: row, error } = await supabase
    .from('payments')
    .select(
      'id, status, amount, sponsorship_id, sponsor_id, student_id, sponsors!inner(profile_id, email), students!inner(full_name)',
    )
    .eq('id', id)
    .single();
  if (error || !row) throw new Error(error?.message ?? 'Payment not found');
  return { supabase, user, row };
}

export async function verifyPaymentAction(id: string, _formData: FormData) {
  const { supabase, user, row } = await loadAdminContext(id);
  if (row.status !== 'submitted') {
    throw new Error('Only submitted payments can be verified.');
  }

  const { error } = await supabase
    .from('payments')
    .update({
      status: 'verified',
      verified_at: new Date().toISOString(),
      verified_by: user.id,
    })
    .eq('id', id);
  if (error) throw new Error(error.message);

  const sponsor = (row as unknown as { sponsors: { profile_id: string; email: string } }).sponsors;
  const student = (row as unknown as { students: { full_name: string } }).students;

  await supabase.from('notifications').insert({
    user_id: sponsor.profile_id,
    title: 'Payment verified',
    message: `Your payment for ${student.full_name} has been verified. Thank you.`,
    type: 'success',
    related_type: 'payment',
    related_id: id,
  });

  await sendEmail({
    to: sponsor.email,
    subject: 'Payment verified — Al-Huffaz Education Portal',
    text: `Your payment for ${student.full_name} has been verified. Thank you for your support.`,
  });

  await logActivity({ action: 'payment.verified', objectType: 'payment', objectId: id });

  revalidatePath('/admin/payments');
  revalidatePath('/sponsor/payments');
  revalidatePath('/sponsor/students');
}

export async function rejectPaymentAction(id: string, formData: FormData) {
  const { supabase, row } = await loadAdminContext(id);
  if (row.status !== 'submitted') {
    throw new Error('Only submitted payments can be rejected.');
  }
  const reason = String(formData.get('reason') ?? '').trim() || null;

  const { error } = await supabase
    .from('payments')
    .update({ status: 'rejected', rejected_reason: reason })
    .eq('id', id);
  if (error) throw new Error(error.message);

  const sponsor = (row as unknown as { sponsors: { profile_id: string; email: string } }).sponsors;
  const student = (row as unknown as { students: { full_name: string } }).students;

  await supabase.from('notifications').insert({
    user_id: sponsor.profile_id,
    title: 'Payment rejected',
    message:
      reason ??
      `Your payment for ${student.full_name} could not be verified. Please review the details and resubmit.`,
    type: 'warning',
    related_type: 'payment',
    related_id: id,
  });

  await sendEmail({
    to: sponsor.email,
    subject: 'Payment needs attention — Al-Huffaz Education Portal',
    text:
      reason ??
      `Your payment for ${student.full_name} was rejected. Please review and resubmit from your portal.`,
  });

  await logActivity({
    action: 'payment.rejected',
    objectType: 'payment',
    objectId: id,
    details: { reason },
  });

  revalidatePath('/admin/payments');
  revalidatePath('/sponsor/payments');
}
