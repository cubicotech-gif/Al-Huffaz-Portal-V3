import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { StudentForm, type StudentFormDefaults } from '@/components/student-form';
import {
  archiveStudentAction,
  restoreStudentAction,
  updateStudentAction,
} from '@/lib/students/actions';
import { getStudentById, signedPhotoUrl } from '@/lib/students/queries';

export const runtime = 'edge';

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile } = await requireRole(['admin', 'staff']);
  const { id } = await params;
  const student = await getStudentById(id);
  if (!student) notFound();

  const photoSignedUrl = await signedPhotoUrl(student.photo_url);
  const defaults: StudentFormDefaults = { ...student, photo_signed_url: photoSignedUrl };
  const updateWithId = updateStudentAction.bind(null, id);
  const archiveWithId = archiveStudentAction.bind(null, id);
  const restoreWithId = restoreStudentAction.bind(null, id);

  return (
    <DashboardShell role={profile.role === 'admin' ? 'Admin' : 'Staff'} name={profile.full_name}>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link
            href="/admin/students"
            className="text-sm font-semibold text-brand-600 hover:underline"
          >
            ← Back to students
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">{student.full_name}</h1>
          <p className="text-sm text-slate-600">
            {student.archived_at ? 'Archived' : 'Active'} · GR #{student.gr_number ?? '—'}
          </p>
        </div>

        {student.archived_at ? (
          <form action={restoreWithId}>
            <button
              type="submit"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:border-slate-300"
            >
              Restore
            </button>
          </form>
        ) : (
          <form action={archiveWithId}>
            <button
              type="submit"
              className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-sm font-semibold text-rose-700 hover:bg-rose-50"
            >
              Archive
            </button>
          </form>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <StudentForm action={updateWithId} defaults={defaults} submitLabel="Save changes" />
      </div>
    </DashboardShell>
  );
}
