'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  IconActivity,
  IconBell,
  IconGraduationCap,
  IconHeart,
  IconHome,
  IconInbox,
  IconMenu,
  IconSettings,
  IconUpload,
  IconUserPlus,
  IconUsers,
  IconWallet,
  IconX,
} from '@/components/icons';

type IconComponent = React.ComponentType<{ className?: string; strokeWidth?: number }>;

type NavItem = {
  href: string;
  label: string;
  icon: IconComponent;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const ADMIN_NAV: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ href: '/admin', label: 'Dashboard', icon: IconHome }],
  },
  {
    label: 'Roll',
    items: [
      { href: '/admin/students', label: 'Students', icon: IconGraduationCap },
      { href: '/admin/students/import', label: 'Import CSV', icon: IconUpload },
    ],
  },
  {
    label: 'Sponsorships',
    items: [
      { href: '/admin/sponsorships', label: 'Sponsorship queue', icon: IconInbox },
      { href: '/admin/payments', label: 'Payments queue', icon: IconWallet },
    ],
  },
  {
    label: 'People',
    items: [
      { href: '/admin/sponsors/pending', label: 'Pending sponsors', icon: IconUserPlus },
      { href: '/admin/sponsors', label: 'Sponsors', icon: IconUsers },
      { href: '/admin/staff', label: 'Staff', icon: IconUsers },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/notifications', label: 'Notifications', icon: IconBell },
      { href: '/admin/activity', label: 'Activity log', icon: IconActivity },
      { href: '/admin/settings', label: 'Settings', icon: IconSettings },
    ],
  },
];

const STAFF_NAV: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ href: '/admin', label: 'Dashboard', icon: IconHome }],
  },
  {
    label: 'Roll',
    items: [
      { href: '/admin/students', label: 'Students', icon: IconGraduationCap },
      { href: '/admin/students/import', label: 'Import CSV', icon: IconUpload },
    ],
  },
  {
    label: 'System',
    items: [{ href: '/admin/notifications', label: 'Notifications', icon: IconBell }],
  },
];

const SPONSOR_NAV: NavGroup[] = [
  {
    label: 'Dashboard',
    items: [{ href: '/sponsor', label: 'Home', icon: IconHome }],
  },
  {
    label: 'My sponsorships',
    items: [
      { href: '/sponsor/students', label: 'My students', icon: IconHeart },
      { href: '/sponsor/pay', label: 'Submit payment', icon: IconWallet },
      { href: '/sponsor/payments', label: 'Payment history', icon: IconInbox },
    ],
  },
  {
    label: 'Browse',
    items: [{ href: '/students', label: 'Available students', icon: IconGraduationCap }],
  },
  {
    label: 'Account',
    items: [{ href: '/sponsor/notifications', label: 'Notifications', icon: IconBell }],
  },
];

function navFor(role: 'admin' | 'staff' | 'sponsor'): NavGroup[] {
  if (role === 'admin') return ADMIN_NAV;
  if (role === 'staff') return STAFF_NAV;
  return SPONSOR_NAV;
}

function isActive(current: string, href: string): boolean {
  if (href === '/admin' || href === '/sponsor' || href === '/') return current === href;
  return current === href || current.startsWith(href + '/');
}

export function Sidebar({ role }: { role: 'admin' | 'staff' | 'sponsor' }) {
  const pathname = usePathname() ?? '';
  const [open, setOpen] = useState(false);
  const groups = navFor(role);

  return (
    <>
      {/* Mobile top-bar menu button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="no-print fixed left-3 top-3 z-30 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm lg:hidden"
        aria-label="Open menu"
      >
        <IconMenu className="h-5 w-5 text-slate-700" />
      </button>

      {/* Desktop sidebar */}
      <aside className="no-print fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <SidebarContent groups={groups} pathname={pathname} onNavigate={() => {}} />
      </aside>

      {/* Mobile slide-over */}
      {open ? (
        <div className="no-print fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-slate-200 bg-white shadow-xl">
            <div className="flex justify-end p-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label="Close menu"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent groups={groups} pathname={pathname} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}
    </>
  );
}

function SidebarContent({
  groups,
  pathname,
  onNavigate,
}: {
  groups: NavGroup[];
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-3 border-b border-slate-100 px-5 py-4"
      >
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

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition ${
                        active
                          ? 'bg-brand-50 text-brand-700'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${active ? 'text-brand-600' : 'text-slate-500'}`}
                      />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}
