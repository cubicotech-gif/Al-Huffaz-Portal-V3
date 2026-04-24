import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { createClient } from '@/lib/supabase/server';
import { formatMinorUnits } from '@/lib/money';
import { listSponsorPayments } from '@/lib/payments/queries';

export const runtime = 'edge';

const STATUS_BADGES: Record<string, string> = {
  submitted: 'bg-amber-100 text-amber-700',
  verified: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
  refunded: 'bg-slate-100 text-slate-700',
};

export default async function SponsorPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { profile } = await requireRole(['sponsor']);
  const params = await searchParams;

  const supabase = await createClient();
  const { data: sponsor } = await supabase
    .from('sponsors')
    .select('id')
    .eq('profile_id', profile.id)
    .single();

  const payments = sponsor ? await listSponsorPayments(sponsor.id) : [];

  return (
    <DashboardShell role="Sponsor" name={profile.full_name}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/sponsor" className="text-sm font-semibold text-brand-600 hover:underline">
            ← Back to dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">My payments</h1>
        </div>
        <Link
          href="/sponsor/pay"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
        >
          + Submit payment
        </Link>
      </div>

      {params.submitted === '1' ? (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Payment submitted. An administrator will review and verify it shortly.
        </div>
      ) : null}

      {payments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-sm text-slate-600">No payments submitted yet.</p>
          <Link
            href="/sponsor/pay"
            className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:underline"
          >
            Submit your first payment →
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {p.student?.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{formatMinorUnits(p.amount)}</td>
                  <td className="px-4 py-3 text-slate-600">{p.payment_method.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(p.payment_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
                        STATUS_BADGES[p.status] ?? 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {p.status}
                    </span>
                    {p.status === 'rejected' && p.rejected_reason ? (
                      <p className="mt-1 text-[11px] text-rose-600">{p.rejected_reason}</p>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
