import Link from 'next/link';
import { IconPencil } from '@/components/icons';

const TABS = [
  { slug: '', label: 'Overview' },
  { slug: 'edit', label: 'Basic Info' },
  { slug: 'fees', label: 'Fees' },
  { slug: 'attendance', label: 'Attendance' },
  { slug: 'academics', label: 'Academics' },
  { slug: 'behavior', label: 'Behaviour' },
] as const;

export function StudentTabs({
  id,
  active,
}: {
  id: string;
  active: '' | 'edit' | 'fees' | 'attendance' | 'academics' | 'behavior';
}) {
  return (
    <nav className="mb-6 flex flex-wrap gap-2 border-b border-slate-200">
      {TABS.map((t) => {
        const href = t.slug ? `/admin/students/${id}/${t.slug}` : `/admin/students/${id}`;
        const isActive = t.slug === active;
        return (
          <Link
            key={t.slug || 'overview'}
            href={href}
            className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-semibold ${
              isActive
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label}
            {isActive && t.slug === 'edit' ? <EditingBadge /> : null}
          </Link>
        );
      })}
    </nav>
  );
}

function EditingBadge() {
  return (
    <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
      <IconPencil className="h-3 w-3" />
      Editing
    </span>
  );
}
