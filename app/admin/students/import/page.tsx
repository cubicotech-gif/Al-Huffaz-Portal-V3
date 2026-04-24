import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { ImportForm } from './import-form';

export const runtime = 'edge';

const TEMPLATE_COLUMNS = [
  'full_name',
  'gr_number',
  'roll_number',
  'gender',
  'date_of_birth',
  'admission_date',
  'grade_level',
  'islamic_category',
  'permanent_address',
  'current_address',
  'father_name',
  'father_cnic',
  'father_email',
  'guardian_name',
  'guardian_cnic',
  'guardian_phone',
  'guardian_whatsapp',
  'guardian_email',
  'relationship',
  'emergency_contact',
  'emergency_whatsapp',
  'blood_group',
  'allergies',
  'medical_conditions',
  'health_rating',
  'cleanness_rating',
  'zakat_eligible',
  'donation_eligible',
];

export default async function ImportStudentsPage() {
  const { profile } = await requireRole(['admin', 'staff']);

  return (
    <DashboardShell
      role={profile.role === 'admin' ? 'Admin' : 'Staff'}
      name={profile.full_name}
      notificationsHref="/admin/notifications"
    >
      <div className="mb-6">
        <Link
          href="/admin/students"
          className="text-sm font-semibold text-brand-600 hover:underline"
        >
          ← Back to students
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Import students from CSV</h1>
        <p className="text-sm text-slate-600">
          Upload a CSV to bulk-create students. The first row must contain column headers. Only{' '}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">full_name</code> is required;
          every other column is optional.
        </p>
      </div>

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-600">
          Template
        </h2>
        <p className="mb-3 text-xs text-slate-600">
          Copy these headers into row 1 of your CSV.
        </p>
        <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-[11px] leading-5 text-slate-800">
          {TEMPLATE_COLUMNS.join(',')}
        </pre>
        <ul className="mt-3 space-y-1 text-xs text-slate-600">
          <li>
            <code>gender</code> — one of <code>male</code>, <code>female</code>, <code>other</code>{' '}
            (or blank).
          </li>
          <li>
            <code>islamic_category</code> — one of <code>hifz</code>, <code>nazra</code>,{' '}
            <code>qaidah</code>, <code>none</code>.
          </li>
          <li>
            <code>zakat_eligible</code>, <code>donation_eligible</code> — <code>true</code> /{' '}
            <code>false</code> (or <code>yes</code>/<code>1</code> / blank).
          </li>
          <li>
            <code>health_rating</code>, <code>cleanness_rating</code> — integer 1–5 (optional).
          </li>
          <li>Dates in <code>YYYY-MM-DD</code> format.</li>
        </ul>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-600">
          Upload
        </h2>
        <ImportForm />
      </div>
    </DashboardShell>
  );
}
