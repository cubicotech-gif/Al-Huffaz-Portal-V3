import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export default async function Home() {
  const supabase = await createClient();
  const { count: availableCount } = await supabase
    .from('public_available_students')
    .select('id', { count: 'exact', head: true });

  return (
    <main className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              AH
            </div>
            <span className="text-sm font-semibold text-slate-900">Al-Huffaz Education Portal</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/students" className="font-semibold text-slate-700 hover:text-brand-700">
              Browse students
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:border-slate-300"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-600">
              Al-Huffaz Islamic School · Sponsorship programme
            </p>
            <h1 className="mb-6 text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
              Sponsor a child's Islamic and academic education.
            </h1>
            <p className="mb-8 max-w-lg text-base leading-relaxed text-slate-600">
              Al-Huffaz provides full-time Islamic and academic schooling to children across
              Pakistan. Browse available students, pick one to sponsor, and contribute monthly
              towards their fees, uniform, and materials.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/students"
                className="rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
              >
                Browse {availableCount ?? 0} available student{availableCount === 1 ? '' : 's'}
              </Link>
              <Link
                href="/register"
                className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand-200 hover:text-brand-700"
              >
                Become a sponsor
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-600">
              How it works
            </h2>
            <ol className="space-y-4 text-sm text-slate-700">
              <Step n={1} title="Register as a sponsor" body="Create your account and wait for admin approval." />
              <Step n={2} title="Pick a student" body="Browse donation-eligible children who need a sponsor." />
              <Step n={3} title="Submit monthly payments" body="Upload payment proofs; admin verifies and the sponsorship goes live." />
              <Step n={4} title="Follow their progress" body="See updates, attendance, and grades in your sponsor dashboard." />
            </ol>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-xs text-slate-500">
          <span>© Al-Huffaz Islamic School</span>
          <Link href="/api/health" className="font-mono hover:text-slate-700">
            /api/health
          </Link>
        </div>
      </footer>
    </main>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
        {n}
      </span>
      <div>
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="text-slate-600">{body}</p>
      </div>
    </li>
  );
}
