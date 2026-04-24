'use client';

import { useActionState } from 'react';
import { FormError } from '@/components/auth-card';
import { importStudentsAction, type ImportState } from './actions';

const INITIAL: ImportState = {};

export function ImportForm() {
  const [state, action, pending] = useActionState(importStudentsAction, INITIAL);

  return (
    <div className="space-y-6">
      <form action={action} encType="multipart/form-data" className="space-y-4">
        <FormError message={state.error} />
        <input
          type="file"
          name="csv"
          accept="text/csv,.csv"
          required
          className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? 'Importing…' : 'Import'}
        </button>
      </form>

      {state.summary ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="mb-3 text-sm text-slate-700">
            <span className="font-semibold text-slate-900">{state.summary.inserted}</span> of{' '}
            {state.summary.total} rows inserted.
            {state.summary.errors.length > 0 ? (
              <span className="text-rose-700"> {state.summary.errors.length} failed.</span>
            ) : null}
          </p>
          {state.summary.errors.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-rose-200">
              <table className="w-full text-xs">
                <thead className="bg-rose-50 text-left text-[10px] font-medium uppercase tracking-wider text-rose-700">
                  <tr>
                    <th className="px-3 py-2">Row</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-100 bg-white">
                  {state.summary.errors.map((e) => (
                    <tr key={`${e.row}-${e.name}`}>
                      <td className="px-3 py-2 font-mono text-slate-600">{e.row}</td>
                      <td className="px-3 py-2 text-slate-800">{e.name || '—'}</td>
                      <td className="px-3 py-2 text-rose-700">{e.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
