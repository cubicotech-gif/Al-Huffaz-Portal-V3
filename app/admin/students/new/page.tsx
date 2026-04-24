import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { StudentForm } from '@/components/student-form';
import { createStudentAction } from '@/lib/students/actions';

export const runtime = 'edge';

export default async function NewStudentPage() {
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
        <h1 className="mt-2 text-2xl font-bold text-slate-900">New student</h1>
        <p className="text-sm text-slate-600">
          Add a student to the roll. Only full name is required; everything else can be filled in
          later.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <StudentForm action={createStudentAction} submitLabel="Create student" />
      </div>
    </DashboardShell>
  );
}
