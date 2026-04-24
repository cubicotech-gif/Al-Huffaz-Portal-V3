import Link from 'next/link';

export function PublicHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            AH
          </div>
          <span className="text-sm font-semibold text-slate-900">Al-Huffaz Education Portal</span>
        </Link>
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
  );
}
