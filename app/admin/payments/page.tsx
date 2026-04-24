import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { formatMinorUnits } from '@/lib/money';
import { listAdminPayments, proofSignedUrl } from '@/lib/payments/queries';
import { rejectPaymentAction, verifyPaymentAction } from '@/lib/payments/actions';

export const runtime = 'edge';

const TABS = [
  { value: 'submitted', label: 'Queue' },
  { value: 'verified', label: 'Verified' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' },
] as const;

type TabValue = (typeof TABS)[number]['value'];

const STATUS_BADGES: Record<string, string> = {
  submitted: 'bg-amber-100 text-amber-700',
  verified: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
  refunded: 'bg-slate-100 text-slate-700',
};

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { profile } = await requireRole(['admin', 'staff']);
  const params = await searchParams;
  const status: TabValue = (TABS.find((t) => t.value === params.status)?.value ?? 'submitted');

  const rows = await listAdminPayments(status);
  const signedProofs = await Promise.all(rows.map((r) => proofSignedUrl(r.proof_url)));

  return (
    <DashboardShell
      role={profile.role === 'admin' ? 'Admin' : 'Staff'}
      name={profile.full_name}
      notificationsHref="/admin/notifications"
    >
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Payments</h1>
      <p className="mb-6 text-sm text-slate-600">
        Review sponsor-submitted payments. Verifying a payment activates its sponsorship
        automatically.
      </p>

      <nav className="mb-6 flex gap-2 border-b border-slate-200">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/admin/payments?status=${t.value}`}
            className={`border-b-2 px-3 py-2 text-sm font-semibold ${
              status === t.value
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-600">
          Nothing in this tab.
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((row, i) => {
            const verifyBound = verifyPaymentAction.bind(null, row.id);
            const rejectBound = rejectPaymentAction.bind(null, row.id);
            const proofUrl = signedProofs[i];
            return (
              <div
                key={row.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {row.student?.full_name ?? '—'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {row.sponsor?.display_name ?? '—'} · {row.sponsor?.email ?? ''}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
                      STATUS_BADGES[row.status] ?? 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {row.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <Detail label="Amount" value={formatMinorUnits(row.amount)} />
                  <Detail label="Method" value={row.payment_method.replace('_', ' ')} />
                  <Detail label="Date" value={new Date(row.payment_date).toLocaleDateString()} />
                  <Detail label="Bank / wallet" value={row.bank_name ?? '—'} />
                  <Detail label="Txn ID" value={row.transaction_id ?? '—'} />
                  <Detail
                    label="Submitted"
                    value={new Date(row.created_at).toLocaleDateString()}
                  />
                  {row.notes ? (
                    <div className="col-span-2 sm:col-span-4">
                      <Detail label="Notes" value={row.notes} />
                    </div>
                  ) : null}
                </div>

                {proofUrl ? (
                  <p className="mt-4 text-sm">
                    <a
                      href={proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-brand-600 hover:underline"
                    >
                      View proof →
                    </a>
                  </p>
                ) : null}

                {row.status === 'rejected' && row.rejected_reason ? (
                  <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                    Rejected: {row.rejected_reason}
                  </p>
                ) : null}

                {row.status === 'submitted' ? (
                  <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                    <form action={verifyBound}>
                      <button
                        type="submit"
                        className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
                      >
                        Verify
                      </button>
                    </form>
                    <form action={rejectBound} className="flex items-center gap-2">
                      <input
                        type="text"
                        name="reason"
                        placeholder="Rejection reason (optional)"
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                      />
                      <button
                        type="submit"
                        className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm text-slate-800">{value}</p>
    </div>
  );
}
