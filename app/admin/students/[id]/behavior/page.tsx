import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { StudentTabs } from '@/components/student-tabs';
import { createClient } from '@/lib/supabase/server';
import { deleteBehaviorAction, saveBehaviorAction } from '@/lib/students/related/actions';
import { getBehavior, listBehavior } from '@/lib/students/related/queries';
import { goalsToString } from '@/lib/students/related/schema';
import { academicYearOptions } from '@/lib/students/schema';
import { BehaviorForm, type BehaviorDefaults } from './behavior-form';

export const runtime = 'edge';

const EMPTY: BehaviorDefaults = {
  academic_year: '',
  academic_term: '',
  homework_completion: '',
  class_participation: '',
  group_work: '',
  problem_solving: '',
  organization: '',
  teacher_comments: '',
  goals_text: '',
};

export default async function StudentBehaviorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { profile } = await requireRole(['admin', 'staff']);
  const { id } = await params;
  const { edit } = await searchParams;

  const supabase = await createClient();
  const { data: student } = await supabase
    .from('students')
    .select('id, full_name, gr_number')
    .eq('id', id)
    .single();
  if (!student) notFound();

  const [rows, editing, { data: school }] = await Promise.all([
    listBehavior(id),
    edit ? getBehavior(edit) : null,
    supabase.from('schools').select('academic_year').limit(1).single(),
  ]);
  const yearOptions = academicYearOptions(school?.academic_year ?? null);
  const editingRow = editing && editing.student_id === id ? editing : null;

  const defaults: BehaviorDefaults = editingRow
    ? {
        academic_year: editingRow.academic_year ?? '',
        academic_term: editingRow.academic_term ?? '',
        homework_completion: editingRow.homework_completion ?? '',
        class_participation: editingRow.class_participation ?? '',
        group_work: editingRow.group_work ?? '',
        problem_solving: editingRow.problem_solving ?? '',
        organization: editingRow.organization ?? '',
        teacher_comments: editingRow.teacher_comments ?? '',
        goals_text: goalsToString(editingRow.goals),
      }
    : EMPTY;

  const action = saveBehaviorAction.bind(null, id, editingRow?.id ?? null);

  return (
    <DashboardShell
      role={profile.role === 'admin' ? 'Admin' : 'Staff'}
      name={profile.full_name}
      notificationsHref="/admin/notifications"
    >
      <div className="mb-4">
        <Link
          href="/admin/students"
          className="text-sm font-semibold text-brand-600 hover:underline"
        >
          ← Back to students
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{student.full_name}</h1>
        <p className="text-sm text-slate-600">GR #{student.gr_number ?? '—'} · Behaviour</p>
      </div>
      <StudentTabs id={id} active="behavior" />

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-600">
          {editingRow
            ? `Edit ${editingRow.academic_year} · ${editingRow.academic_term}`
            : 'Add behaviour record'}
        </h2>
        <BehaviorForm
          action={action}
          defaults={defaults}
          submitLabel={editingRow ? 'Save changes' : 'Add record'}
          yearOptions={yearOptions}
        />
        {editingRow ? (
          <div className="mt-3">
            <Link
              href={`/admin/students/${id}/behavior`}
              className="text-xs font-semibold text-slate-600 hover:underline"
            >
              Cancel edit
            </Link>
          </div>
        ) : null}
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-600">
        Recorded terms ({rows.length})
      </h2>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
          No behaviour records yet.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const goals = Array.isArray(r.goals) ? (r.goals as unknown[]).filter((g) => typeof g === 'string') as string[] : [];
            const del = deleteBehaviorAction.bind(null, id, r.id);
            return (
              <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-start justify-between">
                  <p className="font-semibold text-slate-900">
                    {r.academic_year} · {r.academic_term}
                  </p>
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/students/${id}/behavior?edit=${r.id}`}
                      className="text-sm font-semibold text-brand-600 hover:underline"
                    >
                      Edit
                    </Link>
                    <form action={del}>
                      <button
                        type="submit"
                        className="text-sm font-semibold text-rose-600 hover:underline"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <Row label="Homework" value={r.homework_completion} />
                  <Row label="Class participation" value={r.class_participation} />
                  <Row label="Group work" value={r.group_work} />
                  <Row label="Problem solving" value={r.problem_solving} />
                  <Row label="Organization" value={r.organization} />
                </div>

                {r.teacher_comments ? (
                  <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                      Teacher comments
                    </p>
                    {r.teacher_comments}
                  </div>
                ) : null}

                {goals.length > 0 ? (
                  <div className="mt-3">
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                      Goals
                    </p>
                    <ul className="list-disc space-y-0.5 pl-5 text-sm text-slate-700">
                      {goals.map((g, i) => (
                        <li key={`${r.id}-goal-${i}`}>{g}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm text-slate-800">{value || '—'}</p>
    </div>
  );
}
