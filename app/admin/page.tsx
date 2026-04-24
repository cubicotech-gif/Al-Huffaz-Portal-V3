import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { createClient } from '@/lib/supabase/server';
import {
  IconActivity,
  IconArrowRight,
  IconGraduationCap,
  IconHeart,
  IconInbox,
  IconSettings,
  IconUpload,
  IconUserPlus,
  IconUsers,
  IconWallet,
} from '@/components/icons';

export const runtime = 'edge';

type IconComponent = React.ComponentType<{ className?: string; strokeWidth?: number }>;

export default async function AdminHome() {
  const { profile } = await requireRole(['admin', 'staff']);
  const supabase = await createClient();

  const [
    { count: activeStudents },
    { count: sponsoredStudents },
    { count: pendingSponsors },
    { count: pendingRequests },
    { count: pendingPayments },
  ] = await Promise.all([
    supabase
      .from('students')
      .select('id', { count: 'exact', head: true })
      .is('archived_at', null),
    supabase
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('is_sponsored', true)
      .is('archived_at', null),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'pending_sponsor')
      .eq('is_active', true),
    supabase
      .from('sponsorships')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'requested'),
    supabase
      .from('payments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'submitted'),
  ]);

  const displayRole = profile.role === 'admin' ? 'Admin' : 'Staff';
  const firstName = profile.full_name.split(' ')[0] ?? profile.full_name;

  return (
    <DashboardShell role={displayRole} name={profile.full_name} notificationsHref="/admin/notifications">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome, {firstName}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Here's what's waiting for your attention today.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Active students"
          value={activeStudents ?? 0}
          icon={IconGraduationCap}
          tone="slate"
        />
        <StatCard
          label="Sponsored"
          value={sponsoredStudents ?? 0}
          icon={IconHeart}
          tone="brand"
        />
        <StatCard
          label="Pending sponsors"
          value={pendingSponsors ?? 0}
          icon={IconUserPlus}
          tone={pendingSponsors ? 'amber' : 'slate'}
        />
        <StatCard
          label="Open requests"
          value={pendingRequests ?? 0}
          icon={IconInbox}
          tone={pendingRequests ? 'amber' : 'slate'}
        />
        <StatCard
          label="Payments to verify"
          value={pendingPayments ?? 0}
          icon={IconWallet}
          tone={pendingPayments ? 'amber' : 'slate'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <NavCard
          href="/admin/students"
          title="Students"
          body="Browse, create, and manage the student roll."
          icon={IconGraduationCap}
        />
        <NavCard
          href="/admin/sponsorships?status=requested"
          title="Sponsorship queue"
          body={`${pendingRequests ?? 0} request${pendingRequests === 1 ? '' : 's'} awaiting review.`}
          icon={IconInbox}
          highlight={Boolean(pendingRequests)}
        />
        <NavCard
          href="/admin/payments?status=submitted"
          title="Payments queue"
          body={`${pendingPayments ?? 0} payment${pendingPayments === 1 ? '' : 's'} to verify.`}
          icon={IconWallet}
          highlight={Boolean(pendingPayments)}
        />
        {profile.role === 'admin' ? (
          <>
            <NavCard
              href="/admin/sponsors/pending"
              title="Sponsor approvals"
              body={`${pendingSponsors ?? 0} pending account${pendingSponsors === 1 ? '' : 's'}.`}
              icon={IconUserPlus}
              highlight={Boolean(pendingSponsors)}
            />
            <NavCard
              href="/admin/sponsors"
              title="Sponsors"
              body="Pause, reactivate, delete, or re-engage a sponsor."
              icon={IconUsers}
            />
            <NavCard
              href="/admin/staff"
              title="Staff"
              body="Grant or revoke staff access by email."
              icon={IconUsers}
            />
          </>
        ) : null}
        <NavCard
          href="/admin/students/import"
          title="Bulk import"
          body="Add many students at once from a CSV file."
          icon={IconUpload}
        />
        {profile.role === 'admin' ? (
          <>
            <NavCard
              href="/admin/activity"
              title="Activity log"
              body="Audit every write action in the portal."
              icon={IconActivity}
            />
            <NavCard
              href="/admin/settings"
              title="Settings"
              body="School info, currency, academic year, exports."
              icon={IconSettings}
            />
          </>
        ) : null}
      </div>
    </DashboardShell>
  );
}

const TONES = {
  slate: { bg: 'bg-slate-100', icon: 'text-slate-600' },
  brand: { bg: 'bg-brand-100', icon: 'text-brand-700' },
  amber: { bg: 'bg-amber-100', icon: 'text-amber-700' },
} as const;

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: IconComponent;
  tone: keyof typeof TONES;
}) {
  const style = TONES[tone];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${style.bg}`}>
          <Icon className={`h-4 w-4 ${style.icon}`} />
        </span>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
      </div>
      <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function NavCard({
  href,
  title,
  body,
  icon: Icon,
  highlight = false,
}: {
  href: string;
  title: string;
  body: string;
  icon: IconComponent;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex flex-col rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${
        highlight
          ? 'border-brand-200 bg-brand-50/40 hover:border-brand-300'
          : 'border-slate-200 bg-white hover:border-brand-300'
      }`}
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-100">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 flex-1 text-sm text-slate-600">{body}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
        Open <IconArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}
