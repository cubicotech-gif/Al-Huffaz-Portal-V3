import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { createClient } from '@/lib/supabase/server';
import { formatMinorUnits } from '@/lib/money';

export const runtime = 'edge';

const BADGE_COLORS: Record<string, string> = {
  requested: 'bg-amber-100 text-amber-700',
  approved: 'bg-brand-100 text-brand-700',
  active: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-slate-100 text-slate-700',
  cancelled: 'bg-slate-100 text-slate-600',
  rejected: 'bg-rose-100 text-rose-700',
};

export default async function SponsorStudentsPage() {
  const { profile } = await requireRole(['sponsor']);
  const supabase = await createClient();

  const { data: sponsor } = await supabase
    .from('sponsors')
    .select('id')
    .eq('profile_id', profile.id)
    .single();

  const { data } = sponsor
    ? await supabase
        .from('sponsorships')
        .select(
          'id, status, monthly_amount, requested_at, student:students(id, full_name, grade_level, islamic_category)',
        )
        .eq('sponsor_id', sponsor.id)
        .order('requested_at', { ascending: false })
    : { data: [] };

  const rows = data ?? [];

  return (
    <DashboardShell role="Sponsor" name={profile.full_name}>
      <div className="mb-6">
        <Link href="/sponsor" className="text-sm font-semibold text-brand-600 hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">My students</h1>
        <p className="text-sm text-slate-600">
          {rows.length} sponsorship{rows.length === 1 ? '' : 's'} on record.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-sm text-slate-600">You haven't sponsored anyone yet.</p>
          <Link
            href="/students"
            className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline"
          >
            Browse available students →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const student = (r as any).student as {
              id: string;
              full_name: string;
              grade_level: string | null;
              islamic_category: string | null;
            } | null;
            return (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {student?.full_name ?? 'Unknown student'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {student?.grade_level ?? 'Grade —'} ·{' '}
                    {student?.islamic_category && student.islamic_category !== 'none'
                      ? student.islamic_category
                      : 'Academic'}{' '}
                    · {formatMinorUnits(r.monthly_amount)}/month
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
                      BADGE_COLORS[r.status] ?? 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
