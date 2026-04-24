import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { createClient } from '@/lib/supabase/server';
import { listPayableSponsorships } from '@/lib/payments/queries';
import { PaymentForm } from './payment-form';

export const runtime = 'edge';

export default async function SponsorPayPage({
  searchParams,
}: {
  searchParams: Promise<{ sponsorship?: string }>;
}) {
  const { profile } = await requireRole(['sponsor']);
  const params = await searchParams;

  const supabase = await createClient();
  const { data: sponsor } = await supabase
    .from('sponsors')
    .select('id')
    .eq('profile_id', profile.id)
    .single();

  const sponsorships = sponsor ? await listPayableSponsorships(sponsor.id) : [];
  const mapped = sponsorships.map((s) => {
    const student = (s as unknown as { student: { full_name: string } | null }).student;
    return {
      id: s.id as string,
      monthly_amount: s.monthly_amount as number,
      status: s.status as string,
      student_name: student?.full_name ?? null,
    };
  });

  return (
    <DashboardShell role="Sponsor" name={profile.full_name}>
      <div className="mb-6">
        <Link href="/sponsor" className="text-sm font-semibold text-brand-600 hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Submit a payment</h1>
        <p className="text-sm text-slate-600">
          Upload a screenshot of your transfer. An administrator will verify it and your sponsorship
          will become active once confirmed.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <PaymentForm sponsorships={mapped} initialSponsorshipId={params.sponsorship} />
      </div>
    </DashboardShell>
  );
}
