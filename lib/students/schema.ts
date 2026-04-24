import { z } from 'zod';

const optionalString = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .nullable();

const optionalDate = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .nullable();

const optionalRating = z
  .preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
    z.number().int().min(1).max(5).nullable(),
  );

const boolish = z.preprocess(
  (v) => v === 'on' || v === 'true' || v === true,
  z.boolean(),
);

export const studentFormSchema = z.object({
  full_name: z.string().trim().min(1, 'Full name is required'),
  gr_number: optionalString,
  roll_number: optionalString,
  gender: z.enum(['male', 'female', 'other']).nullable().catch(null),
  date_of_birth: optionalDate,
  admission_date: optionalDate,
  grade_level: optionalString,
  islamic_category: z.enum(['hifz', 'nazra', 'qaidah', 'none']).default('none'),

  permanent_address: optionalString,
  current_address: optionalString,

  father_name: optionalString,
  father_cnic: optionalString,
  father_phone: optionalString,
  father_email: optionalString,
  guardian_name: optionalString,
  guardian_cnic: optionalString,
  guardian_phone: optionalString,
  guardian_whatsapp: optionalString,
  guardian_email: optionalString,
  relationship: optionalString,
  emergency_contact: optionalString,
  emergency_whatsapp: optionalString,

  blood_group: optionalString,
  allergies: optionalString,
  medical_conditions: optionalString,
  health_rating: optionalRating,
  cleanness_rating: optionalRating,

  zakat_eligible: boolish,
  donation_eligible: boolish,
});

export type StudentFormInput = z.infer<typeof studentFormSchema>;

export const GRADE_LEVELS = [
  'kg1',
  'kg2',
  'class1',
  'class2',
  'class3',
  'class4',
  'class5',
  'class6',
  'class7',
  'class8',
  'level1',
  'level2',
  'shb',
] as const;

export const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
] as const;

export const ISLAMIC_CATEGORIES = [
  { value: 'hifz', label: 'Hifz' },
  { value: 'nazra', label: 'Nazra' },
  { value: 'qaidah', label: 'Qaidah' },
  { value: 'none', label: 'None' },
] as const;

export const SCHOOL_ID = '00000000-0000-0000-0000-000000000001';
