'use client';

import { useActionState } from 'react';
import {
  requestSponsorshipAction,
  type RequestSponsorshipState,
} from '@/lib/sponsorships/actions';

const INITIAL: RequestSponsorshipState = {};

export function SponsorButton({
  studentId,
  disabled,
  disabledReason,
}: {
  studentId: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const action = requestSponsorshipAction.bind(null, studentId);
  const [state, dispatch, pending] = useActionState(action, INITIAL);

  if (disabled) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        {disabledReason ?? 'Not available.'}
      </div>
    );
  }

  return (
    <form action={dispatch} className="space-y-3">
      {state.error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </div>
      ) : null}
      {state.requestedAt ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Request submitted. An administrator will review it shortly.
        </div>
      ) : (
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? 'Submitting…' : 'Sponsor this student'}
        </button>
      )}
    </form>
  );
}
