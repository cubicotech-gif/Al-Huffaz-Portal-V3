import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatMinorUnits } from '@/lib/money';
import { GRADE_LEVELS } from '@/lib/students/schema';
import { PublicHeader } from '@/components/public-header';

export const runtime = 'edge';

type SearchParams = {
  q?: string;
  grade_level?: string;
  islamic?: string;
};

export default async function PublicStudentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('public_available_students')
    .select('id, full_name, grade_level, islamic_category, gender, monthly_fee');

  if (params.q) query = query.ilike('full_name', `%${params.q.trim()}%`);
  if (params.grade_level) query = query.eq('grade_level', params.grade_level);
  if (params.islamic) query = query.eq('islamic_category', params.islamic);

  const { data, error } = await query.order('full_name');
  const rows = (!error && data) || [];

  return (
    <main className="min-h-screen">
      <PublicHeader />

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Available students</h1>
          <p className="mt-2 text-sm text-slate-600">
            These children are waiting for a sponsor. Pick one to support.
          </p>
        </div>

        <form method="get" className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4">
          <input
            type="text"
            name="q"
            defaultValue={params.q ?? ''}
            placeholder="Search by name"
            className="sm:col-span-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          <select
            name="grade_level"
            defaultValue={params.grade_level ?? ''}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            <option value="">All grades</option>
            {GRADE_LEVELS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <select
            name="islamic"
            defaultValue={params.islamic ?? ''}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            <option value="">All programmes</option>
            <option value="hifz">Hifz</option>
            <option value="nazra">Nazra</option>
            <option value="qaidah">Qaidah</option>
            <option value="none">Academic only</option>
          </select>
          <button
            type="submit"
            className="sm:col-span-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Apply filters
          </button>
        </form>

        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-sm text-slate-600">
              No students match your filters right now. Please check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((s) => (
              <Link
                key={s.id}
                href={`/students/${s.id}`}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md"
              >
                <div className="mb-3 flex h-24 w-24 items-center justify-center rounded-2xl bg-brand-50 text-xl font-bold text-brand-700">
                  {initials(s.full_name)}
                </div>
                <h2 className="text-lg font-semibold text-slate-900">{s.full_name}</h2>
                <p className="text-xs text-slate-500">
                  {s.grade_level ?? 'Grade —'} ·{' '}
                  {s.islamic_category && s.islamic_category !== 'none'
                    ? s.islamic_category
                    : 'Academic'}
                </p>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                      Monthly fee
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatMinorUnits(s.monthly_fee)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-brand-600">View →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
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
