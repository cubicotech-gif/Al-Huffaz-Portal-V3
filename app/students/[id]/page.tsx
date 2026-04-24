import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatMinorUnits } from '@/lib/money';
import { PublicHeader } from '@/components/public-header';
import { SponsorButton } from './sponsor-button';

export const runtime = 'edge';

export default async function PublicStudentDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: student } = await supabase
    .from('public_available_students')
    .select('id, full_name, grade_level, islamic_category, gender, monthly_fee')
    .eq('id', id)
    .maybeSingle();

  if (!student) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;
  let alreadyRequested = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    role = profile?.role ?? null;

    if (role === 'sponsor') {
      const { data: sponsor } = await supabase
        .from('sponsors')
        .select('id')
        .eq('profile_id', user.id)
        .single();
      if (sponsor) {
        const { data: existing } = await supabase
          .from('sponsorships')
          .select('id')
          .eq('sponsor_id', sponsor.id)
          .eq('student_id', id)
          .in('status', ['requested', 'approved', 'active', 'paused'])
          .maybeSingle();
        alreadyRequested = !!existing;
      }
    }
  }

  const sponsorDisabled =
    !user || role === 'admin' || role === 'staff' || role === 'pending_sponsor' || alreadyRequested;

  const disabledReason = !user
    ? undefined
    : role === 'pending_sponsor'
      ? 'Your sponsor account is awaiting admin approval.'
      : role === 'admin' || role === 'staff'
        ? 'Staff accounts cannot sponsor students.'
        : alreadyRequested
          ? 'You already have an open request for this student.'
          : undefined;

  return (
    <main className="min-h-screen">
      <PublicHeader />

      <section className="mx-auto max-w-4xl px-6 py-10">
        <Link href="/students" className="text-sm font-semibold text-brand-600 hover:underline">
          ← Back to all students
        </Link>

        <div className="mt-6 grid gap-8 md:grid-cols-[1fr_280px]">
          <div>
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-50 text-2xl font-bold text-brand-700">
                {initials(student.full_name)}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{student.full_name}</h1>
                <p className="mt-1 text-sm text-slate-600">
                  {student.grade_level ?? 'Grade —'} ·{' '}
                  {student.islamic_category && student.islamic_category !== 'none'
                    ? `${student.islamic_category} programme`
                    : 'Academic programme'}
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
                About the sponsorship
              </h2>
              <p className="text-sm leading-relaxed text-slate-700">
                Sponsoring this student covers their monthly school fees, uniform, and course
                materials. You'll be able to submit monthly payments and follow their progress
                through your sponsor dashboard.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                <li>
                  <span className="font-semibold">Monthly fee:</span>{' '}
                  {formatMinorUnits(student.monthly_fee)}
                </li>
                <li>
                  <span className="font-semibold">Grade:</span> {student.grade_level ?? '—'}
                </li>
                <li>
                  <span className="font-semibold">Programme:</span>{' '}
                  {student.islamic_category && student.islamic_category !== 'none'
                    ? student.islamic_category
                    : 'academic'}
                </li>
              </ul>
            </div>
          </div>

          <aside className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              {!user ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-700">
                    Sign in or register as a sponsor to start the request.
                  </p>
                  <Link
                    href={`/login?next=${encodeURIComponent(`/students/${id}`)}`}
                    className="block w-full rounded-lg bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                  >
                    Register
                  </Link>
                </div>
              ) : (
                <SponsorButton
                  studentId={student.id}
                  disabled={sponsorDisabled}
                  disabledReason={disabledReason}
                />
              )}
            </div>
          </aside>
        </div>
      </section>
    </main>
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
