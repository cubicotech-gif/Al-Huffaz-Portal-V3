import Link from 'next/link';
import { SignOutButton } from '@/components/signout-button';

export function DashboardShell({
  role,
  name,
  children,
}: {
  role: string;
  name: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              AH
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-brand-600">
                {role}
              </p>
              <p className="text-sm font-semibold text-slate-900">Al-Huffaz Education Portal</p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{name}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}

export function PlaceholderCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <h2 className="mb-2 text-lg font-semibold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-600">{body}</p>
    </div>
  );
}
