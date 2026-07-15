// Sponsorship plan pricing. v2 offers three sponsorship types with preset
// amounts; v3 computes them from the student's fee line-items.
//
// Formula (v2 "plugin-template" variant):
//   monthly   = monthly_fee
//   quarterly = monthly_fee * 3
//   yearly    = monthly_fee * 12 + one_time
//   one_time  = course_fee + uniform_fee + annual_fee + admission_fee
//
// All amounts are integer minor units (paise). To switch to the alternate
// "legacy-display" formula, this is the only file to change.

export const SPONSORSHIP_TYPES = ['monthly', 'quarterly', 'yearly'] as const;
export type SponsorshipType = (typeof SPONSORSHIP_TYPES)[number];

export const SPONSORSHIP_TYPE_LABELS: Record<SponsorshipType, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

export type FeeBreakdown = {
  monthly_fee: number;
  course_fee: number;
  uniform_fee: number;
  annual_fee: number;
  admission_fee: number;
};

export function isSponsorshipType(v: unknown): v is SponsorshipType {
  return typeof v === 'string' && (SPONSORSHIP_TYPES as readonly string[]).includes(v);
}

function oneTime(fees: FeeBreakdown): number {
  return (
    (fees.course_fee ?? 0) +
    (fees.uniform_fee ?? 0) +
    (fees.annual_fee ?? 0) +
    (fees.admission_fee ?? 0)
  );
}

// Amount payable for one instalment of the chosen plan, in minor units.
export function computePlanAmount(type: SponsorshipType, fees: FeeBreakdown): number {
  const monthly = fees.monthly_fee ?? 0;
  switch (type) {
    case 'monthly':
      return monthly;
    case 'quarterly':
      return monthly * 3;
    case 'yearly':
      return monthly * 12 + oneTime(fees);
    default:
      return monthly;
  }
}

// All three plan amounts at once, for showing the sponsor their options.
export function allPlanAmounts(fees: FeeBreakdown): Record<SponsorshipType, number> {
  return {
    monthly: computePlanAmount('monthly', fees),
    quarterly: computePlanAmount('quarterly', fees),
    yearly: computePlanAmount('yearly', fees),
  };
}
