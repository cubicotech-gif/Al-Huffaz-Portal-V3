import Link from 'next/link';
import { LinkButton } from '@/components/ui/button';

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            AH
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-brand-600">
              Al-Huffaz
            </p>
            <p className="text-sm font-semibold text-slate-900">Education Portal</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/students"
            className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:text-brand-700 sm:inline-flex"
          >
            Browse students
          </Link>
          <LinkButton href="/login" variant="secondary" size="sm">
            Sign in
          </LinkButton>
          <LinkButton href="/register" variant="primary" size="sm">
            Become a sponsor
          </LinkButton>
        </div>
      </div>
    </header>
  );
}
