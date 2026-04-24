import Link from 'next/link';
import { PublicHeader } from '@/components/public-header';
import { LinkButton } from '@/components/ui/button';
import { formatMinorUnits } from '@/lib/money';
import { createClient } from '@/lib/supabase/server';
import {
  IconArrowRight,
  IconBookOpen,
  IconCheckCircle,
  IconGraduationCap,
  IconHeart,
  IconShield,
  IconSparkles,
  IconWallet,
} from '@/components/icons';

export const runtime = 'edge';

export default async function Home() {
  const supabase = await createClient();

  const [{ data: availableCount }, { data: featured }] = await Promise.all([
    supabase
      .from('public_available_students')
      .select('id', { count: 'exact', head: true })
      .then((r) => ({ data: r.count ?? 0 })),
    supabase
      .from('public_available_students')
      .select('id, full_name, grade_level, islamic_category, monthly_fee')
      .limit(3)
      .then((r) => ({ data: r.data ?? [] })),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-brand-50 via-white to-emerald-50">
        <div className="absolute inset-0 -z-10 opacity-50" aria-hidden="true">
          <div className="absolute left-1/3 top-10 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl" />
          <div className="absolute right-1/4 bottom-0 h-64 w-64 rounded-full bg-emerald-200/40 blur-3xl" />
        </div>
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white/60 px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm">
              <IconSparkles className="h-3.5 w-3.5" />
              Al-Huffaz Islamic School
            </span>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              Sponsor a child's <span className="text-brand-700">education</span> — every rupee reaches the classroom.
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              Give our students the gift of learning. Browse donation-eligible children, pick one to
              sponsor, and follow their progress term by term.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/students" variant="primary">
                <span>Browse available students</span>
                <IconArrowRight className="h-4 w-4" />
              </LinkButton>
              <LinkButton href="/register" variant="secondary">
                Become a sponsor
              </LinkButton>
            </div>

            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-slate-200/80 pt-6">
              <Metric label="Available now" value={availableCount} />
              <Metric label="Verified impact" value="100%" />
              <Metric label="Runs on" value="donations" />
            </dl>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <h2 className="mb-2 text-center text-3xl font-bold tracking-tight text-slate-900">
          How it works
        </h2>
        <p className="mx-auto mb-10 max-w-2xl text-center text-slate-600">
          Three simple steps. Each sponsorship is matched to a specific student and is always
          tracked end-to-end.
        </p>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <Step
            index={1}
            title="Create your account"
            body="Register as a sponsor. An administrator will review and approve your account within a day."
            icon={IconShield}
          />
          <Step
            index={2}
            title="Pick a student"
            body="Browse children waiting for support. See their grade, programme, and monthly cost."
            icon={IconGraduationCap}
          />
          <Step
            index={3}
            title="Send your contribution"
            body="Transfer the monthly fee and upload the proof. We verify and activate your sponsorship."
            icon={IconWallet}
          />
        </div>
      </section>

      {/* Available students preview */}
      {featured.length > 0 ? (
        <section className="border-t border-slate-200 bg-white py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                  Students waiting for a sponsor
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {availableCount} children currently need support.
                </p>
              </div>
              <Link
                href="/students"
                className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"
              >
                See all <IconArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((s) => (
                <Link
                  key={s.id}
                  href={`/students/${s.id}`}
                  className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md"
                >
                  <div className="mb-3 inline-flex items-center gap-1.5 self-start rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-medium text-brand-700">
                    <IconBookOpen className="h-3 w-3" />
                    {s.islamic_category && s.islamic_category !== 'none'
                      ? s.islamic_category
                      : 'Academic'}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{s.full_name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{s.grade_level ?? 'Grade —'}</p>
                  <p className="mt-4 text-sm text-slate-600">
                    <span className="font-semibold text-slate-900">
                      {formatMinorUnits(s.monthly_fee as number)}
                    </span>{' '}
                    / month
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                    Sponsor this child <IconArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Trust strip */}
      <section className="border-t border-slate-200 bg-slate-50 py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-6 text-sm text-slate-600 sm:grid-cols-3">
            <TrustItem
              icon={IconCheckCircle}
              title="Every payment is verified"
              body="Admins check each transfer against the sponsor's proof before it activates."
            />
            <TrustItem
              icon={IconHeart}
              title="Direct to one child"
              body="You're matched with a specific student — not a pooled donation."
            />
            <TrustItem
              icon={IconShield}
              title="Privacy-first"
              body="Student data stays protected; sponsors only see the child they support."
            />
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 text-xs text-slate-500 sm:px-6">
          <p>© {new Date().getFullYear()} Al-Huffaz Islamic School. All rights reserved.</p>
          <p>
            Health check:{' '}
            <a href="/api/health" className="font-mono text-brand-600 hover:underline">
              /api/health
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

type IconComponent = React.ComponentType<{ className?: string; strokeWidth?: number }>;

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="mt-1 text-2xl font-bold text-slate-900">{value}</dd>
    </div>
  );
}

function Step({
  index,
  title,
  body,
  icon: Icon,
}: {
  index: number;
  title: string;
  body: string;
  icon: IconComponent;
}) {
  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="absolute -top-3 left-6 flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white shadow">
        {index}
      </div>
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{body}</p>
    </div>
  );
}

function TrustItem({
  icon: Icon,
  title,
  body,
}: {
  icon: IconComponent;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="mt-0.5 text-slate-600">{body}</p>
      </div>
    </div>
  );
}
