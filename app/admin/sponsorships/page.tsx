import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { createClient } from '@/lib/supabase/server';
import { formatMinorUnits } from '@/lib/money';
import {
  approveSponsorshipAction,
  rejectSponsorshipAction,
} from '@/lib/sponsorships/actions';

export const runtime = 'edge';

type SearchParams = { status?: string };

const STATUS_TABS = ['requested', 'approved', 'active', 'paused', 'cancelled', 'rejected'] as const;

export default async function SponsorshipsQueuePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { profile } = await requireRole(['admin', 'staff']);
  const params = await searchParams;
  const activeStatus = STATUS_TABS.includes(params.status as (typeof STATUS_TABS)[number])
    ? (params.status as (typeof STATUS_TABS)[number])
    : 'requested';

  const supabase = await createClient();
  const { data } = await supabase
    .from('sponsorships')
    .select(
      'id, status, monthly_amount, requested_at, approved_at, rejected_at, notes, rejection_reason, sponsor:sponsors(display_name, email), student:students(full_name, grade_level)',
    )
    .eq('status', activeStatus)
    .order('requested_at', { ascending: false });

  const rows = data ?? [];

  return (
    <DashboardShell
      role={profile.role === 'admin' ? 'Admin' : 'Staff'}
      name={profile.full_name}
      notificationsHref="/admin/notifications"
    >
      <div className="mb-6">
        <Link href="/admin" className="text-sm font-semibold text-brand-600 hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Sponsorships</h1>
        <p className="text-sm text-slate-600">Approve, reject, and review sponsorship requests.</p>
      </div>

      <nav className="mb-6 flex flex-wrap gap-2">
        {STATUS_TABS.map((s) => (
          <Link
            key={s}
            href={`/admin/sponsorships?status=${s}`}
            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${
              activeStatus === s
                ? 'bg-brand-600 text-white'
                : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300'
            }`}
          >
            {s}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-sm text-slate-600">No {activeStatus} sponsorships.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const approve = approveSponsorshipAction.bind(null, r.id);
            const reject = rejectSponsorshipAction.bind(null, r.id);
            const sponsor = (r as any).sponsor as { display_name: string; email: string } | null;
            const student = (r as any).student as { full_name: string; grade_level: string | null } | null;
            return (
              <div
                key={r.id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    {sponsor?.display_name ?? 'Unknown sponsor'}
                    <span className="text-slate-400">→</span>
                    <span>{student?.full_name ?? 'Unknown student'}</span>
                    {student?.grade_level ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                        {student.grade_level}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Requested {new Date(r.requested_at).toLocaleDateString()} ·{' '}
                    {formatMinorUnits(r.monthly_amount)}/month
                  </p>
                  {r.rejection_reason ? (
                    <p className="mt-2 rounded border border-rose-100 bg-rose-50 px-2 py-1 text-xs text-rose-700">
                      {r.rejection_reason}
                    </p>
                  ) : null}
                </div>

                {activeStatus === 'requested' ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <form action={reject} className="flex items-center gap-1">
                      <input
                        type="text"
                        name="reason"
                        placeholder="Reason (optional)"
                        className="w-44 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                      />
                      <button
                        type="submit"
                        className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        Reject
                      </button>
                    </form>
                    <form action={approve}>
                      <button
                        type="submit"
                        className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
                      >
                        Approve
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
