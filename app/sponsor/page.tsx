import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { createClient } from '@/lib/supabase/server';
import { formatMinorUnits } from '@/lib/money';
import {
  IconArrowRight,
  IconClock,
  IconGraduationCap,
  IconHeart,
  IconInbox,
  IconWallet,
} from '@/components/icons';

export const runtime = 'edge';

type IconComponent = React.ComponentType<{ className?: string; strokeWidth?: number }>;

export default async function SponsorHome() {
  const { profile } = await requireRole(['sponsor']);
  const supabase = await createClient();

  const { data: sponsor } = await supabase
    .from('sponsors')
    .select('id, display_name, approved_at')
    .eq('profile_id', profile.id)
    .single();

  const sponsorId = sponsor?.id;

  const [{ data: active }, { data: requested }, { data: recent }] = sponsorId
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
  const firstName = profile.full_name.split(' ')[0] ?? profile.full_name;

  return (
    <DashboardShell role="Sponsor" name={profile.full_name}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back, {firstName}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {sponsor
            ? `Signed in as ${sponsor.display_name}.`
            : 'Your sponsor record is not yet set up — please contact an administrator.'}
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Active sponsorships" value={activeCount} icon={IconHeart} tone="brand" />
        <StatCard
          label="Monthly commitment"
          value={formatMinorUnits(monthlyTotal)}
          icon={IconWallet}
          tone="emerald"
        />
        <StatCard
          label="Pending requests"
          value={requestedCount}
          icon={IconClock}
          tone={requestedCount ? 'amber' : 'slate'}
        />
      </div>

      <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-2">
        <NavCard
          href="/sponsor/students"
          title="My students"
          body="See the children you're sponsoring or have requested."
          icon={IconHeart}
        />
        <NavCard
          href="/sponsor/pay"
          title="Submit a payment"
          body="Upload a screenshot of your transfer so we can verify it."
          icon={IconWallet}
        />
        <NavCard
          href="/sponsor/payments"
          title="Payment history"
          body="Review submitted, verified, and rejected payments."
          icon={IconInbox}
        />
        <NavCard
          href="/students"
          title="Browse more students"
          body="Find another child to sponsor."
          icon={IconGraduationCap}
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
            No activity yet.{' '}
            <Link href="/students" className="font-semibold text-brand-600 hover:underline">
              Find a student
            </Link>{' '}
            to sponsor.
          </div>
        )}
      </section>
    </DashboardShell>
  );
}

const TONES = {
  slate: { bg: 'bg-slate-100', icon: 'text-slate-600' },
  brand: { bg: 'bg-brand-100', icon: 'text-brand-700' },
  amber: { bg: 'bg-amber-100', icon: 'text-amber-700' },
  emerald: { bg: 'bg-emerald-100', icon: 'text-emerald-700' },
} as const;

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number | string;
  icon: IconComponent;
  tone: keyof typeof TONES;
}) {
  const style = TONES[tone];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${style.bg}`}>
          <Icon className={`h-4 w-4 ${style.icon}`} />
        </span>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function NavCard({
  href,
  title,
  body,
  icon: Icon,
}: {
  href: string;
  title: string;
  body: string;
  icon: IconComponent;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md"
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-100">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 flex-1 text-sm text-slate-600">{body}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
        Open <IconArrowRight className="h-4 w-4" />
      </span>
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
