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
  const [{ data: sponsor }, { data: school }] = await Promise.all([
    supabase.from('sponsors').select('id').eq('profile_id', profile.id).single(),
    supabase
      .from('schools')
      .select(
        'bank_name, account_title, account_number, iban, swift_code, payment_instructions',
      )
      .limit(1)
      .single(),
  ]);

  const bankRows: { label: string; value: string }[] = [
    { label: 'Bank', value: school?.bank_name ?? '' },
    { label: 'Account title', value: school?.account_title ?? '' },
    { label: 'Account number', value: school?.account_number ?? '' },
    { label: 'IBAN', value: school?.iban ?? '' },
    { label: 'SWIFT / BIC', value: school?.swift_code ?? '' },
  ].filter((r) => r.value.trim().length > 0);

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

      {bankRows.length > 0 || school?.payment_instructions ? (
        <div className="mb-6 rounded-2xl border border-brand-200 bg-brand-50/40 p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-700">
            Where to send your transfer
          </h2>
          {bankRows.length > 0 ? (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
              {bankRows.map((r) => (
                <div key={r.label} className="flex justify-between gap-3 text-sm">
                  <dt className="text-slate-500">{r.label}</dt>
                  <dd className="font-medium text-slate-900">{r.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {school?.payment_instructions ? (
            <p className="mt-3 whitespace-pre-wrap border-t border-brand-200/60 pt-3 text-sm text-slate-700">
              {school.payment_instructions}
            </p>
          ) : null}
          <p className="mt-3 text-xs text-slate-500">
            After transferring, upload your receipt below and an administrator will verify it.
          </p>
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <PaymentForm sponsorships={mapped} initialSponsorshipId={params.sponsorship} />
      </div>
    </DashboardShell>
  );
}
