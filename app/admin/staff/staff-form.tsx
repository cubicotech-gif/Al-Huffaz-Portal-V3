'use client';

import { useActionState } from 'react';
import { FormError } from '@/components/auth-card';
import { grantStaffAction, type StaffFormState } from '@/lib/staff/actions';

const INITIAL: StaffFormState = {};

export function GrantStaffForm() {
  const [state, action, pending] = useActionState(grantStaffAction, INITIAL);

  return (
    <form action={action} className="space-y-3">
      <FormError message={state.error} />
      {state.info ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.info}
        </div>
      ) : null}
      <div className="flex items-start gap-2">
        <input
          type="email"
          name="email"
          required
          placeholder="teacher@example.com"
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? 'Granting…' : 'Grant staff'}
        </button>
      </div>
      <p className="text-xs text-slate-500">
        The user must already have an account (they can register at /register or be added via Supabase).
      </p>
    </form>
  );
}
