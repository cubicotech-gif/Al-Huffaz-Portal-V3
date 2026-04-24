import { requireRole } from '@/lib/auth';
import { DashboardShell, PlaceholderCard } from '@/components/dashboard-shell';

export const runtime = 'edge';

export default async function SponsorHome() {
  const { profile } = await requireRole(['sponsor']);

  return (
    <DashboardShell role="Sponsor" name={profile.full_name}>
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Welcome</h1>
      <p className="mb-8 text-sm text-slate-600">
        Your sponsor account is active. Browsing students and submitting payments will be enabled in
        the next phases.
      </p>
      <PlaceholderCard
        title="Student browsing coming soon"
        body="Phase 3 adds the available-students grid and sponsorship requests; Phase 4 adds payment submission."
      />
    </DashboardShell>
  );
}
