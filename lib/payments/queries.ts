import { createClient } from '@/lib/supabase/server';

export type SponsorPaymentRow = {
  id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  status: 'submitted' | 'verified' | 'rejected' | 'refunded';
  created_at: string;
  rejected_reason: string | null;
  student: { full_name: string } | null;
};

export type AdminPaymentRow = SponsorPaymentRow & {
  bank_name: string | null;
  transaction_id: string | null;
  notes: string | null;
  proof_url: string | null;
  sponsor: { display_name: string; email: string } | null;
};

export async function listSponsorPayments(sponsorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('payments')
    .select(
      'id, amount, payment_method, payment_date, status, created_at, rejected_reason, student:students(full_name)',
    )
    .eq('sponsor_id', sponsorId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as SponsorPaymentRow[];
}

export async function listAdminPayments(status: 'submitted' | 'verified' | 'rejected' | 'all') {
  const supabase = await createClient();
  let query = supabase
    .from('payments')
    .select(
      'id, amount, payment_method, payment_date, status, created_at, bank_name, transaction_id, notes, proof_url, rejected_reason, student:students(full_name), sponsor:sponsors(display_name, email)',
    )
    .order('created_at', { ascending: false });
  if (status !== 'all') query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as AdminPaymentRow[];
}

export async function listPayableSponsorships(sponsorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('sponsorships')
    .select('id, status, monthly_amount, student:students(id, full_name, grade_level)')
    .eq('sponsor_id', sponsorId)
    .in('status', ['approved', 'active', 'paused'])
    .order('requested_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function proofSignedUrl(path: string | null) {
  if (!path) return null;
  const supabase = await createClient();
  const { data } = await supabase.storage.from('payment-proofs').createSignedUrl(path, 60 * 10);
  return data?.signedUrl ?? null;
}
