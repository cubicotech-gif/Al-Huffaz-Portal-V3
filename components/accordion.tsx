'use client';

import { useState, type ReactNode } from 'react';
import { IconChevronRight } from '@/components/icons';

type IconComponent = React.ComponentType<{ className?: string; strokeWidth?: number }>;

export function AccordionSection({
  title,
  description,
  icon: Icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  description?: string;
  icon?: IconComponent;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-slate-50"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          {Icon ? (
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <Icon className="h-5 w-5" />
            </span>
          ) : null}
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-xs text-slate-500">{description}</p>
            ) : null}
          </div>
        </div>
        <IconChevronRight
          className={`h-5 w-5 text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`}
        />
      </button>
      {open ? (
        <div className="border-t border-slate-100 px-5 py-5">{children}</div>
      ) : null}
    </section>
  );
}
