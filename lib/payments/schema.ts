import { z } from 'zod';

export const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'wire_transfer', label: 'Wire transfer' },
  { value: 'jazzcash', label: 'JazzCash' },
  { value: 'easypaisa', label: 'Easypaisa' },
  { value: 'card', label: 'Card' },
  { value: 'other_international', label: 'Other (international)' },
  { value: 'other', label: 'Other' },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]['value'];

const optionalString = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .nullable();

export const paymentFormSchema = z.object({
  sponsorship_id: z.string().uuid('Invalid sponsorship'),
  amount_major: z
    .preprocess((v) => (v === '' || v == null ? NaN : Number(v)), z.number().positive('Amount must be greater than zero')),
  payment_method: z.enum([
    'bank_transfer',
    'wire_transfer',
    'jazzcash',
    'easypaisa',
    'card',
    'other_international',
    'other',
  ]),
  bank_name: optionalString,
  transaction_id: optionalString,
  payment_date: z.string().trim().min(1, 'Payment date is required'),
  notes: optionalString,
});

export type PaymentFormInput = z.infer<typeof paymentFormSchema>;

export const MAX_PROOF_BYTES = 5 * 1024 * 1024;
export const ALLOWED_PROOF_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);
