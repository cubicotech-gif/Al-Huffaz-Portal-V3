import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { PrintButton } from '@/components/print-button';
import { formatMinorUnits } from '@/lib/money';
import { getSponsorDetail } from '@/lib/sponsors/queries';
import {
  deleteSponsorAction,
  pauseSponsorAction,
  reactivateSponsorAction,
  reengageSponsorAction,
} from '@/lib/sponsors/actions';
import { createClient } from '@/lib/supabase/server';

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

  const supabase = await createClient();
  const { data: school } = await supabase
    .from('schools')
    .select('name')
    .limit(1)
    .single();

  const verifiedTotalMinor = payments
    .filter((p) => p.status === 'verified')
    .reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
  const activeMonthlyMinor = sponsorships
    .filter((s) => ['approved', 'active'].includes(s.status as string))
    .reduce((sum, s) => sum + Number(s.monthly_amount ?? 0), 0);

  return (
    <DashboardShell role="Admin" name={profile.full_name} notificationsHref="/admin/notifications">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3 no-print">
        <div>
          <Link href="/admin/sponsors" className="text-sm font-semibold text-brand-600 hover:underline">
            ← Back to sponsors
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">{sponsor.display_name}</h1>
          <p className="text-sm text-slate-600">
            {sponsor.email || 'no email'} · {sponsor.country ?? '—'} · joined{' '}
            {new Date(sponsor.created_at).toLocaleDateString()}
          </p>
        </div>
        <PrintButton />
      </div>

      {/* Print-only header */}
      <div className="hidden border-b border-slate-300 pb-3 text-center print:block">
        <p className="text-sm font-semibold uppercase tracking-wider text-slate-700">
          {school?.name ?? 'Al-Huffaz Islamic School'}
        </p>
        <p className="text-xs text-slate-600">Sponsor Profile</p>
      </div>

      <div className="space-y-6">
        {/* Identity card */}
        <section className="print-card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">{sponsor.display_name}</h2>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
                status === 'active'
                  ? 'bg-emerald-100 text-emerald-700'
                  : status === 'paused'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {status}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Email" value={sponsor.email} />
            <Field label="Phone" value={sponsor.phone} />
            <Field label="WhatsApp" value={sponsor.whatsapp} />
            <Field label="Country" value={sponsor.country} />
            <Field
              label="Approved"
              value={sponsor.approved_at ? new Date(sponsor.approved_at).toLocaleDateString() : null}
            />
            <Field
              label="Reactivated"
              value={
                sponsor.reactivated_at ? new Date(sponsor.reactivated_at).toLocaleDateString() : null
              }
            />
            <Field
              label="Deleted"
              value={
                sponsor.account_deleted_at
                  ? new Date(sponsor.account_deleted_at).toLocaleDateString()
                  : null
              }
            />
            <Field label="Joined" value={new Date(sponsor.created_at).toLocaleDateString()} />
          </div>
        </section>

        {/* Summary */}
        <section className="print-card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-700">
            Summary
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Stat label="Active sponsorships" value={sponsorships.filter((s) => ['approved', 'active'].includes(s.status as string)).length} />
            <Stat label="Monthly commitment" value={formatMinorUnits(activeMonthlyMinor)} />
            <Stat label="Verified contributions" value={formatMinorUnits(verifiedTotalMinor)} />
          </div>
        </section>

        {/* Account actions (not printed) */}
        <section className="no-print rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-600">
            Account actions
          </h2>
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
        </section>

        {/* Sponsorships */}
        <section className="print-card">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-700">
            Sponsorships
          </h3>
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
        </section>

        {/* Payments */}
        <section className="print-card">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-700">
            Recent payments
          </h3>
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
        </section>
      </div>
    </DashboardShell>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm text-slate-800">{value || '—'}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
