import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

export function Field({
  label,
  name,
  hint,
  children,
}: {
  label: string;
  name?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={name} className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-600">
        {label}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-slate-500">{hint}</span> : null}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      id={props.id ?? props.name}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-slate-50"
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      id={props.id ?? props.name}
      rows={props.rows ?? 3}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
    />
  );
}

export function Select({
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select
      {...props}
      id={props.id ?? props.name}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
    >
      {children}
    </select>
  );
}

export function Checkbox({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input
        type="checkbox"
        name={name}
        id={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
      />
      <span>{label}</span>
    </label>
  );
}

export function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="border-b border-slate-200 pb-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">{title}</h2>
      {description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}
    </div>
  );
}
