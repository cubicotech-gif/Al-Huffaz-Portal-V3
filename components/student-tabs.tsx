import Link from 'next/link';

const TABS = [
  { slug: '', label: 'Profile' },
  { slug: 'edit', label: 'Edit' },
  { slug: 'fees', label: 'Fees' },
  { slug: 'academics', label: 'Academics' },
  { slug: 'behavior', label: 'Behaviour' },
] as const;

export function StudentTabs({
  id,
  active,
}: {
  id: string;
  active: '' | 'edit' | 'fees' | 'academics' | 'behavior';
}) {
  return (
    <nav className="mb-6 flex flex-wrap gap-2 border-b border-slate-200">
      {TABS.map((t) => {
        const href = t.slug ? `/admin/students/${id}/${t.slug}` : `/admin/students/${id}`;
        const isActive = t.slug === active;
        return (
          <Link
            key={t.slug || 'profile'}
            href={href}
            className={`border-b-2 px-3 py-2 text-sm font-semibold ${
              isActive
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
