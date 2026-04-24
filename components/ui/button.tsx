import Link from 'next/link';
import type { ComponentProps } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

const BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-700',
  secondary:
    'border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-brand-300 hover:text-brand-700',
  ghost: 'text-slate-700 hover:bg-slate-100',
  danger:
    'border border-rose-200 bg-white text-rose-700 shadow-sm hover:bg-rose-50 hover:border-rose-300',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
};

export function buttonClasses({
  variant = 'primary',
  size = 'md',
  className = '',
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`.trim();
}

type ButtonProps = ComponentProps<'button'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({ variant, size, className, ...rest }: ButtonProps) {
  return <button className={buttonClasses({ variant, size, className })} {...rest} />;
}

type LinkButtonProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function LinkButton({ variant, size, className, ...rest }: LinkButtonProps) {
  return <Link className={buttonClasses({ variant, size, className })} {...rest} />;
}
