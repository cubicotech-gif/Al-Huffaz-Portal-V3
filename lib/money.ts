const SYMBOL = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || 'Rs.';

export function formatMinorUnits(amount: bigint | number | null | undefined): string {
  if (amount == null) return `${SYMBOL} 0`;
  const major = typeof amount === 'bigint' ? Number(amount) / 100 : amount / 100;
  return `${SYMBOL} ${major.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
}
