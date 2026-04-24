import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { createClient } from '@/lib/supabase/server';
import { formatMinorUnits } from '@/lib/money';

export const runtime = 'edge';

export default async function SponsorHome() {
  const { profile } = await requireRole(['sponsor']);
  const supabase = await createClient();

  const { data: sponsor } = await supabase
    .from('sponsors')
    .select('id, display_name, approved_at')
    .eq('profile_id', profile.id)
    .single();

  const sponsorId = sponsor?.id;

  const [
    { data: active },
    { data: requested },
    { data: recent },
  ] = sponsorId
    ? await Promise.all([
        supabase
          .from('sponsorships')
          .select('id, monthly_amount, student:students(full_name)')
          .eq('sponsor_id', sponsorId)
          .in('status', ['approved', 'active']),
        supabase
          .from('sponsorships')
          .select('id')
          .eq('sponsor_id', sponsorId)
          .eq('status', 'requested'),
        supabase
          .from('sponsorships')
          .select('id, status, requested_at, student:students(full_name)')
          .eq('sponsor_id', sponsorId)
          .order('requested_at', { ascending: false })
          .limit(5),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const activeCount = active?.length ?? 0;
  const monthlyTotal = (active ?? []).reduce((sum, r) => sum + Number(r.monthly_amount ?? 0), 0);
  const requestedCount = requested?.length ?? 0;

  return (
    <DashboardShell role="Sponsor" name={profile.full_name}>
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Welcome back</h1>
      <p className="mb-8 text-sm text-slate-600">
        {sponsor
          ? `Signed in as ${sponsor.display_name}.`
          : 'Your sponsor record is not yet set up — please contact an administrator.'}
      </p>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Active sponsorships" value={activeCount} />
        <Stat label="Monthly commitment" value={formatMinorUnits(monthlyTotal)} />
        <Stat label="Pending requests" value={requestedCount} />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NavCard
          href="/sponsor/students"
          title="My students"
          body="See the children you're sponsoring or have requested."
          cta="Open"
        />
        <NavCard
          href="/students"
          title="Browse more students"
          body="Find another child to sponsor."
          cta="Browse"
        />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-600">
          Recent activity
        </h2>
        {recent && recent.length > 0 ? (
          <ul className="space-y-2">
            {recent.map((r) => {
              const student = (r as any).student as { full_name: string } | null;
              return (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{student?.full_name ?? '—'}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(r.requested_at).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
            No activity yet. <Link href="/students" className="font-semibold text-brand-600 hover:underline">Find a student</Link> to sponsor.
          </div>
        )}
      </section>
    </DashboardShell>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function NavCard({
  href,
  title,
  body,
  cta,
}: {
  href: string;
  title: string;
  body: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-300 hover:shadow-md"
    >
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 flex-1 text-sm text-slate-600">{body}</p>
      <span className="mt-3 text-sm font-semibold text-brand-600">{cta} →</span>
    </Link>
  );
}

const BADGE_COLORS: Record<string, string> = {
  requested: 'bg-amber-100 text-amber-700',
  approved: 'bg-brand-100 text-brand-700',
  active: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-slate-100 text-slate-700',
  cancelled: 'bg-slate-100 text-slate-600',
  rejected: 'bg-rose-100 text-rose-700',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
        BADGE_COLORS[status] ?? 'bg-slate-100 text-slate-700'
      }`}
    >
      {status}
    </span>
  );
}
