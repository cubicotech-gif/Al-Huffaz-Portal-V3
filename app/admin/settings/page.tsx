import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { createClient } from '@/lib/supabase/server';
import { SCHOOL_ID } from '@/lib/students/schema';
import { SettingsForm } from './settings-form';

export const runtime = 'edge';

export default async function SettingsPage() {
  const { profile } = await requireRole(['admin']);
  const supabase = await createClient();

  const { data: school } = await supabase
    .from('schools')
    .select('name, email, phone, address, currency, currency_symbol, academic_year')
    .eq('id', SCHOOL_ID)
    .single();

  const defaults = {
    name: school?.name ?? 'Al-Huffaz Islamic School',
    email: school?.email ?? null,
    phone: school?.phone ?? null,
    address: school?.address ?? null,
    currency: school?.currency ?? 'PKR',
    currency_symbol: school?.currency_symbol ?? 'Rs.',
    academic_year: school?.academic_year ?? null,
  };

  return (
    <DashboardShell role="Admin" name={profile.full_name} notificationsHref="/admin/notifications">
      <div className="mb-6">
        <Link href="/admin" className="text-sm font-semibold text-brand-600 hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-600">School information, currency, and academic year.</p>
      </div>

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-600">
          School
        </h2>
        <SettingsForm defaults={defaults} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-600">
          Data exports
        </h2>
        <p className="mb-4 text-sm text-slate-600">
          Download a CSV snapshot of each dataset. Exports record an entry in the activity log.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/api/admin/exports/students"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:border-brand-300 hover:text-brand-700"
          >
            Students CSV
          </a>
          <a
            href="/api/admin/exports/sponsorships"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:border-brand-300 hover:text-brand-700"
          >
            Sponsorships CSV
          </a>
          <a
            href="/api/admin/exports/payments"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:border-brand-300 hover:text-brand-700"
          >
            Payments CSV
          </a>
        </div>
      </div>
    </DashboardShell>
  );
}
