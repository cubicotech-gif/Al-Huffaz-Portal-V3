import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { toCsv } from '@/lib/csv';
import { logActivity } from '@/lib/activity';

export const runtime = 'edge';

type Row = {
  id: string;
  status: string;
  monthly_amount: number;
  requested_at: string;
  approved_at: string | null;
  ended_at: string | null;
  student_name: string | null;
  sponsor_name: string | null;
  sponsor_email: string | null;
};

export async function GET() {
  await requireRole(['admin', 'staff']);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('sponsorships')
    .select(
      'id, status, monthly_amount, requested_at, approved_at, ended_at, student:students(full_name), sponsor:sponsors(display_name, email)',
    )
    .order('requested_at', { ascending: false });
  if (error) return new Response(error.message, { status: 500 });

  const flat: Row[] = (data ?? []).map((r) => {
    const raw = r as unknown as {
      id: string;
      status: string;
      monthly_amount: number;
      requested_at: string;
      approved_at: string | null;
      ended_at: string | null;
      student: { full_name: string } | null;
      sponsor: { display_name: string; email: string } | null;
    };
    return {
      id: raw.id,
      status: raw.status,
      monthly_amount: raw.monthly_amount,
      requested_at: raw.requested_at,
      approved_at: raw.approved_at,
      ended_at: raw.ended_at,
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
    { key: 'status', header: 'status' },
    { key: 'monthly_amount', header: 'monthly_amount_minor' },
    { key: 'requested_at', header: 'requested_at' },
    { key: 'approved_at', header: 'approved_at' },
    { key: 'ended_at', header: 'ended_at' },
  ]);

  await logActivity({ action: 'export.sponsorships', objectType: 'sponsorships' });

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="sponsorships-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
