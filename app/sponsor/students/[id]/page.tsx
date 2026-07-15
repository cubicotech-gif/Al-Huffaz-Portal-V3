import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { PrintButton } from '@/components/print-button';
import { StudentReportCard } from '@/components/student-report-card';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

// Sponsor-facing progress view. Access is enforced by RLS (migration 0010):
// a sponsor can only read the student + academic rows for a child they
// sponsor via a live (approved/active/paused) sponsorship.
export default async function SponsorStudentProgressPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile } = await requireRole(['sponsor']);
  const { id } = await params;
  const supabase = await createClient();

  const { data: sponsor } = await supabase
    .from('sponsors')
    .select('id')
    .eq('profile_id', profile.id)
    .single();
  if (!sponsor) notFound();

  // Confirm the sponsor actually sponsors this student before showing anything.
  const { data: link } = await supabase
    .from('sponsorships')
    .select('id, status')
    .eq('sponsor_id', sponsor.id)
    .eq('student_id', id)
    .in('status', ['approved', 'active', 'paused'])
    .maybeSingle();
  if (!link) notFound();

  const { data: student } = await supabase
    .from('students')
    .select('id, full_name, grade_level, islamic_category, gender')
    .eq('id', id)
    .maybeSingle();
  if (!student) notFound();

  const [{ data: academics }, { data: attendance }, { data: behavior }] = await Promise.all([
    supabase
      .from('student_academics')
      .select('id, academic_year, academic_term, subjects, overall_percentage')
      .eq('student_id', id)
      .order('academic_year', { ascending: false })
      .order('academic_term', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('student_attendance')
      .select('academic_year, academic_term, total_school_days, present_days')
      .eq('student_id', id)
      .order('academic_year', { ascending: false })
      .order('academic_term', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('student_behavior')
      .select(
        'academic_year, academic_term, homework_completion, class_participation, group_work, problem_solving, organization, teacher_comments, goals',
      )
      .eq('student_id', id)
      .order('academic_year', { ascending: false })
      .order('academic_term', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <DashboardShell role="Sponsor" name={profile.full_name}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3 no-print">
        <div>
          <Link
            href="/sponsor/students"
            className="text-sm font-semibold text-brand-600 hover:underline"
          >
            ← Back to my students
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">{student.full_name}</h1>
          <p className="text-sm text-slate-600 capitalize">
            {student.grade_level ?? 'Grade —'} ·{' '}
            {student.islamic_category && student.islamic_category !== 'none'
              ? `${student.islamic_category} programme`
              : 'Academic programme'}{' '}
            · {link.status}
          </p>
        </div>
        <PrintButton />
      </div>

      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-xl font-bold text-brand-700">
          {initials(student.full_name)}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{student.full_name}</p>
          <p className="text-xs text-slate-500">
            Thank you for supporting this child&apos;s education.
          </p>
        </div>
      </div>

      <StudentReportCard academics={academics} attendance={attendance} behavior={behavior} />
    </DashboardShell>
  );
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
