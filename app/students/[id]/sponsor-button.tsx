'use client';

import { useActionState, useState } from 'react';
import {
  requestSponsorshipAction,
  type RequestSponsorshipState,
} from '@/lib/sponsorships/actions';
import { formatMinorUnits } from '@/lib/money';
import {
  SPONSORSHIP_TYPES,
  SPONSORSHIP_TYPE_LABELS,
  type SponsorshipType,
} from '@/lib/sponsorships/pricing';

const INITIAL: RequestSponsorshipState = {};

export function SponsorButton({
  studentId,
  disabled,
  disabledReason,
  planAmounts,
}: {
  studentId: string;
  disabled?: boolean;
  disabledReason?: string;
  planAmounts: Record<SponsorshipType, number>;
}) {
  const action = requestSponsorshipAction.bind(null, studentId);
  const [state, dispatch, pending] = useActionState(action, INITIAL);
  const [plan, setPlan] = useState<SponsorshipType>('monthly');

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
        <>
          <input type="hidden" name="sponsorship_type" value={plan} />
          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Choose a plan
            </legend>
            {SPONSORSHIP_TYPES.map((t) => (
              <label
                key={t}
                className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
                  plan === t
                    ? 'border-brand-400 bg-brand-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="plan_choice"
                    value={t}
                    checked={plan === t}
                    onChange={() => setPlan(t)}
                    className="h-4 w-4 text-brand-600 focus:ring-brand-400"
                  />
                  <span className="font-medium text-slate-800">{SPONSORSHIP_TYPE_LABELS[t]}</span>
                </span>
                <span className="font-semibold text-slate-900">
                  {formatMinorUnits(planAmounts[t])}
                </span>
              </label>
            ))}
          </fieldset>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
          >
            {pending ? 'Submitting…' : 'Sponsor this student'}
          </button>
        </>
      )}
    </form>
  );
}
