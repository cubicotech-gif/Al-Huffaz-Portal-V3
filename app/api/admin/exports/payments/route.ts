import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { toCsv } from '@/lib/csv';
import { logActivity } from '@/lib/activity';

export const runtime = 'edge';

type Row = {
  id: string;
  amount: number;
  payment_method: string;
  bank_name: string | null;
  transaction_id: string | null;
  payment_date: string;
  status: string;
  created_at: string;
  verified_at: string | null;
  student_name: string | null;
  sponsor_name: string | null;
  sponsor_email: string | null;
};

export async function GET() {
  await requireRole(['admin', 'staff']);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('payments')
    .select(
      'id, amount, payment_method, bank_name, transaction_id, payment_date, status, created_at, verified_at, student:students(full_name), sponsor:sponsors(display_name, email)',
    )
    .order('created_at', { ascending: false });
  if (error) return new Response(error.message, { status: 500 });

  const flat: Row[] = (data ?? []).map((r) => {
    const raw = r as unknown as {
      id: string;
      amount: number;
      payment_method: string;
      bank_name: string | null;
      transaction_id: string | null;
      payment_date: string;
      status: string;
      created_at: string;
      verified_at: string | null;
      student: { full_name: string } | null;
      sponsor: { display_name: string; email: string } | null;
    };
    return {
      id: raw.id,
      amount: raw.amount,
      payment_method: raw.payment_method,
      bank_name: raw.bank_name,
      transaction_id: raw.transaction_id,
      payment_date: raw.payment_date,
      status: raw.status,
      created_at: raw.created_at,
      verified_at: raw.verified_at,
      student_name: raw.student?.full_name ?? null,
      sponsor_name: raw.sponsor?.display_name ?? null,
      sponsor_email: raw.sponsor?.email ?? null,
    };
  });

  const csv = toCsv(flat, [
    { key: 'id', header: 'id' },
    { key: 'sponsor_name', header: 'sponsor_name' },
    { key: 'sponsor_email', header: 'sponsor_email' },
    { key: 'student_name', header: 'student_name' },
    { key: 'amount', header: 'amount_minor' },
    { key: 'payment_method', header: 'payment_method' },
    { key: 'bank_name', header: 'bank_name' },
    { key: 'transaction_id', header: 'transaction_id' },
    { key: 'payment_date', header: 'payment_date' },
    { key: 'status', header: 'status' },
    { key: 'verified_at', header: 'verified_at' },
    { key: 'created_at', header: 'created_at' },
  ]);

  await logActivity({ action: 'export.payments', objectType: 'payments' });

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="payments-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
