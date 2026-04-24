import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { formatMinorUnits } from '@/lib/money';
import { getSponsorDetail } from '@/lib/sponsors/queries';
import {
  deleteSponsorAction,
  pauseSponsorAction,
  reactivateSponsorAction,
  reengageSponsorAction,
} from '@/lib/sponsors/actions';

export const runtime = 'edge';

const SPONSORSHIP_COLORS: Record<string, string> = {
  requested: 'bg-amber-100 text-amber-700',
  approved: 'bg-brand-100 text-brand-700',
  active: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-slate-100 text-slate-700',
  cancelled: 'bg-slate-100 text-slate-600',
  rejected: 'bg-rose-100 text-rose-700',
};

const PAYMENT_COLORS: Record<string, string> = {
  submitted: 'bg-amber-100 text-amber-700',
  verified: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
  refunded: 'bg-slate-100 text-slate-700',
};

export default async function SponsorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile } = await requireRole(['admin']);
  const { id } = await params;
  const detail = await getSponsorDetail(id);
  if (!detail) notFound();

  const { sponsor, sponsorships, payments } = detail;
  const status = sponsor.account_status as 'active' | 'paused' | 'deleted';

  const pause = pauseSponsorAction.bind(null, id);
  const reactivate = reactivateSponsorAction.bind(null, id);
  const del = deleteSponsorAction.bind(null, id);
  const reengage = reengageSponsorAction.bind(null, id);

  return (
    <DashboardShell role="Admin" name={profile.full_name} notificationsHref="/admin/notifications">
      <div className="mb-6">
        <Link href="/admin/sponsors" className="text-sm font-semibold text-brand-600 hover:underline">
          ← Back to sponsors
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{sponsor.display_name}</h1>
        <p className="text-sm text-slate-600">
          {sponsor.email || 'no email'} · {sponsor.country ?? '—'} · joined{' '}
          {new Date(sponsor.created_at).toLocaleDateString()}
        </p>
      </div>

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-600">
          Account
        </h2>
        <div className="mb-4 flex items-center gap-3 text-sm text-slate-700">
          <span className="font-semibold">Status:</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium capitalize text-slate-700">
            {status}
          </span>
          {sponsor.approved_at ? (
            <span className="text-xs text-slate-500">
              Approved {new Date(sponsor.approved_at).toLocaleDateString()}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {status === 'active' ? (
            <form action={pause}>
              <button
                type="submit"
                className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-sm font-semibold text-amber-700 hover:bg-amber-50"
              >
                Pause account
              </button>
            </form>
          ) : null}
          {status !== 'active' ? (
            <form action={reactivate}>
              <button
                type="submit"
                className="rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-50"
              >
                Reactivate
              </button>
            </form>
          ) : null}
          {status !== 'deleted' ? (
            <form action={del}>
              <button
                type="submit"
                className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-sm font-semibold text-rose-700 hover:bg-rose-50"
              >
                Delete (end sponsorships)
              </button>
            </form>
          ) : null}
          <form action={reengage}>
            <button
              type="submit"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Send re-engagement email
            </button>
          </form>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-600">
          Sponsorships
        </h2>
        {sponsorships.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
            No sponsorships yet.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Monthly</th>
                  <th className="px-4 py-3">Requested</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sponsorships.map((r) => {
                  const student = (r as unknown as { student: { full_name: string } | null }).student;
                  return (
                    <tr key={r.id}>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {student?.full_name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatMinorUnits(r.monthly_amount as number)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(r.requested_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
                            SPONSORSHIP_COLORS[r.status as string] ?? 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {r.status as string}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-600">
          Recent payments
        </h2>
        {payments.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
            No payments recorded.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => {
                  const student = (p as unknown as { student: { full_name: string } | null }).student;
                  return (
                    <tr key={p.id}>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {student?.full_name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatMinorUnits(p.amount as number)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(p.payment_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
                            PAYMENT_COLORS[p.status as string] ?? 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {p.status as string}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
