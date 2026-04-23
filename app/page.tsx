export const runtime = 'edge';

export default function Home() {
  const deployedAt = new Date().toISOString();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-lg font-bold text-white">
            AH
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-brand-600">
              v3 · Next.js on Cloudflare
            </p>
            <h1 className="text-xl font-semibold text-slate-900">
              Al-Huffaz Education Portal
            </h1>
          </div>
        </div>

        <h2 className="mb-3 text-3xl font-bold text-slate-900">
          Hello — deploy is live.
        </h2>
        <p className="mb-8 text-base leading-relaxed text-slate-600">
          This is the first deploy of the rewritten portal. The full student,
          sponsor, and payment management system will be built on top of this
          foundation.
        </p>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <StatusRow label="Framework" value="Next.js 15 (App Router)" />
          <StatusRow label="Runtime" value="Edge / Cloudflare" />
          <StatusRow label="Hosting" value="Cloudflare Pages" />
          <StatusRow label="Database" value="Supabase (Postgres)" />
          <StatusRow label="Language" value="TypeScript" />
          <StatusRow label="Styling" value="Tailwind CSS" />
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6">
          <p className="text-xs text-slate-500">
            Deployed at <span className="font-mono">{deployedAt}</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Health check:{' '}
            <a
              href="/api/health"
              className="font-mono text-brand-600 hover:underline"
            >
              /api/health
            </a>
          </p>
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-400">
        See <span className="font-mono">CLAUDE.md</span> for the full build
        spec.
      </p>
    </main>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col rounded-lg bg-slate-50 px-3 py-2">
      <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <span className="text-sm font-medium text-slate-900">{value}</span>
    </div>
  );
}
