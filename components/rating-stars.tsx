'use client';

import { useState } from 'react';

// Solid star glyph — filled when value >= index, outlined otherwise.
function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-6 w-6 transition ${
        filled ? 'fill-amber-400 stroke-amber-500' : 'fill-slate-200 stroke-slate-300'
      }`}
      strokeWidth={1.25}
      aria-hidden="true"
    >
      <path d="M12 2.75 14.78 8.4l6.22.9-4.5 4.39 1.06 6.19L12 16.97l-5.56 2.91 1.06-6.19-4.5-4.39 6.22-.9L12 2.75Z" />
    </svg>
  );
}

export function RatingStars({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: number | null;
}) {
  const [value, setValue] = useState<number>(defaultValue ?? 0);
  const [hover, setHover] = useState<number>(0);
  const display = hover || value;

  return (
    <div className="flex items-center gap-1">
      <input type="hidden" name={name} value={value || ''} />
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => setValue(value === i ? 0 : i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          className="rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          aria-label={`${i} star${i > 1 ? 's' : ''}`}
        >
          <Star filled={i <= display} />
        </button>
      ))}
      <button
        type="button"
        onClick={() => setValue(0)}
        className={`ml-2 text-xs font-semibold text-slate-500 hover:text-slate-700 ${
          value === 0 ? 'invisible' : ''
        }`}
      >
        clear
      </button>
    </div>
  );
}

export function RatingStarsDisplay({
  value,
}: {
  value: number | null | undefined;
}) {
  if (value == null) {
    return <span className="text-xs text-slate-400">—</span>;
  }
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} filled={i <= value} />
      ))}
    </div>
  );
}
