'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import {
  Checkbox,
  Field,
  Select,
  Textarea,
  TextInput,
} from '@/components/form-fields';
import { FormError } from '@/components/auth-card';
import { AccordionSection } from '@/components/accordion';
import {
  IconBookOpen,
  IconGraduationCap,
  IconHeart,
  IconShield,
  IconUsers,
} from '@/components/icons';
import {
  GENDERS,
  GRADE_LEVELS,
  ISLAMIC_CATEGORIES,
  RELATIONSHIPS,
} from '@/lib/students/schema';

export type StudentFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  savedAt?: number;
};

type StudentFormAction = (state: StudentFormState, formData: FormData) => Promise<StudentFormState>;

export type StudentFormDefaults = {
  id?: string;
  full_name?: string;
  gr_number?: string | null;
  roll_number?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  date_of_birth?: string | null;
  admission_date?: string | null;
  grade_level?: string | null;
  islamic_category?: 'hifz' | 'nazra' | 'qaidah' | 'none' | null;
  photo_url?: string | null;
  photo_signed_url?: string | null;
  permanent_address?: string | null;
  current_address?: string | null;
  father_name?: string | null;
  father_cnic?: string | null;
  father_email?: string | null;
  guardian_name?: string | null;
  guardian_cnic?: string | null;
  guardian_phone?: string | null;
  guardian_whatsapp?: string | null;
  guardian_email?: string | null;
  relationship?: string | null;
  emergency_contact?: string | null;
  emergency_whatsapp?: string | null;
  blood_group?: string | null;
  allergies?: string | null;
  medical_conditions?: string | null;
  health_rating?: number | null;
  cleanness_rating?: number | null;
  zakat_eligible?: boolean;
  donation_eligible?: boolean;
};

const INITIAL: StudentFormState = {};

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] as const;

export function StudentForm({
  action,
  defaults = {},
  submitLabel,
}: {
  action: StudentFormAction;
  defaults?: StudentFormDefaults;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const err = (name: string) => state.fieldErrors?.[name];
  const isNew = !defaults.id;

  return (
    <form action={formAction} className="space-y-4" encType="multipart/form-data">
      <FormError message={state.error} />
      {state.savedAt ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Saved.
        </div>
      ) : null}

      {/* Basic Information */}
      <AccordionSection
        title="Basic Information"
        description="Identity, enrollment, and address."
        icon={IconGraduationCap}
        defaultOpen
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Student full name">
            <TextInput name="full_name" defaultValue={defaults.full_name ?? ''} required />
            {err('full_name') ? <FieldError message={err('full_name')!} /> : null}
          </Field>
          <Field label="GR number">
            <TextInput name="gr_number" defaultValue={defaults.gr_number ?? ''} />
          </Field>
          <Field label="Roll number">
            <TextInput name="roll_number" defaultValue={defaults.roll_number ?? ''} />
          </Field>
          <Field label="Gender">
            <Select name="gender" defaultValue={defaults.gender ?? ''}>
              <option value="">Select Gender</option>
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date of birth">
            <TextInput type="date" name="date_of_birth" defaultValue={defaults.date_of_birth ?? ''} />
          </Field>
          <Field label="Admission date">
            <TextInput type="date" name="admission_date" defaultValue={defaults.admission_date ?? ''} />
          </Field>
          <Field label="Grade level">
            <Select name="grade_level" defaultValue={defaults.grade_level ?? ''}>
              <option value="">Select Grade</option>
              {GRADE_LEVELS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Islamic studies">
            <Select name="islamic_category" defaultValue={defaults.islamic_category ?? 'none'}>
              {ISLAMIC_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="mt-4 flex items-start gap-6">
          <div className="flex-1">
            <Field label="Student photo" hint="JPEG, PNG, or WebP. Max 2 MB.">
              <input
                type="file"
                name="photo"
                accept="image/jpeg,image/png,image/webp"
                className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
              />
            </Field>
          </div>
          {defaults.photo_signed_url ? (
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={defaults.photo_signed_url}
                alt="Current student photo"
                className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
              />
              <p className="mt-1 text-[11px] text-slate-500">Current photo</p>
            </div>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Permanent address">
            <Textarea name="permanent_address" defaultValue={defaults.permanent_address ?? ''} />
          </Field>
          <Field label="Current address">
            <Textarea name="current_address" defaultValue={defaults.current_address ?? ''} />
          </Field>
        </div>
      </AccordionSection>

      {/* Family Information */}
      <AccordionSection
        title="Family Information"
        description="Father, guardian, and emergency contact."
        icon={IconUsers}
        defaultOpen={isNew}
      >
        <h3 className="mb-2 text-sm font-semibold text-slate-800">Father&apos;s information</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Father's name">
            <TextInput name="father_name" defaultValue={defaults.father_name ?? ''} />
          </Field>
          <Field label="Father's CNIC" hint="XXXXX-XXXXXXX-X">
            <TextInput
              name="father_cnic"
              placeholder="XXXXX-XXXXXXX-X"
              defaultValue={defaults.father_cnic ?? ''}
            />
          </Field>
          <Field label="Father's email">
            <TextInput type="email" name="father_email" defaultValue={defaults.father_email ?? ''} />
          </Field>
        </div>

        <h3 className="mb-2 mt-6 text-sm font-semibold text-slate-800">Guardian information</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Guardian name">
            <TextInput name="guardian_name" defaultValue={defaults.guardian_name ?? ''} />
          </Field>
          <Field label="Guardian CNIC" hint="XXXXX-XXXXXXX-X">
            <TextInput
              name="guardian_cnic"
              placeholder="XXXXX-XXXXXXX-X"
              defaultValue={defaults.guardian_cnic ?? ''}
            />
          </Field>
          <Field label="Relationship">
            <Select name="relationship" defaultValue={defaults.relationship ?? ''}>
              <option value="">Select</option>
              {RELATIONSHIPS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Guardian email">
            <TextInput
              type="email"
              name="guardian_email"
              defaultValue={defaults.guardian_email ?? ''}
            />
          </Field>
          <Field label="Guardian phone">
            <TextInput
              type="tel"
              name="guardian_phone"
              defaultValue={defaults.guardian_phone ?? ''}
            />
          </Field>
          <Field label="Guardian WhatsApp">
            <TextInput
              type="tel"
              name="guardian_whatsapp"
              defaultValue={defaults.guardian_whatsapp ?? ''}
            />
          </Field>
        </div>

        <h3 className="mb-2 mt-6 text-sm font-semibold text-slate-800">Emergency contact</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Emergency phone">
            <TextInput
              type="tel"
              name="emergency_contact"
              defaultValue={defaults.emergency_contact ?? ''}
            />
          </Field>
          <Field label="Emergency WhatsApp">
            <TextInput
              type="tel"
              name="emergency_whatsapp"
              defaultValue={defaults.emergency_whatsapp ?? ''}
            />
          </Field>
        </div>
      </AccordionSection>

      {/* Health */}
      <AccordionSection
        title="Health"
        description="Medical information and initial health assessment."
        icon={IconHeart}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Blood group">
            <Select name="blood_group" defaultValue={defaults.blood_group ?? ''}>
              <option value="">Select</option>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Health rating (1–5)">
            <TextInput
              type="number"
              min={1}
              max={5}
              name="health_rating"
              defaultValue={defaults.health_rating ?? ''}
            />
          </Field>
          <Field label="Cleanness rating (1–5)">
            <TextInput
              type="number"
              min={1}
              max={5}
              name="cleanness_rating"
              defaultValue={defaults.cleanness_rating ?? ''}
            />
          </Field>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Allergies">
            <Textarea name="allergies" defaultValue={defaults.allergies ?? ''} rows={2} />
          </Field>
          <Field label="Medical conditions">
            <Textarea
              name="medical_conditions"
              defaultValue={defaults.medical_conditions ?? ''}
              rows={2}
            />
          </Field>
        </div>
      </AccordionSection>

      {/* Financial Aid Eligibility */}
      <AccordionSection
        title="Financial aid eligibility"
        description="Controls whether the student appears in the public sponsorship list."
        icon={IconShield}
        defaultOpen={isNew}
      >
        <div className="space-y-2">
          <Checkbox
            name="zakat_eligible"
            label="Eligible for Zakat"
            defaultChecked={defaults.zakat_eligible ?? false}
          />
          <Checkbox
            name="donation_eligible"
            label="Eligible for Donations / Sponsorship (shows in public students list when unsponsored)"
            defaultChecked={defaults.donation_eligible ?? false}
          />
        </div>
      </AccordionSection>

      {!isNew ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
          <p className="flex items-start gap-2">
            <IconBookOpen className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500" />
            <span>
              Per-term <strong>fees</strong>, <strong>academics</strong>, and{' '}
              <strong>behaviour</strong> are edited in their own tabs above.
            </span>
          </p>
        </div>
      ) : null}

      <div className="flex items-center gap-3 border-t border-slate-200 pt-6">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? 'Saving…' : submitLabel}
        </button>
        <Link
          href={defaults.id ? `/admin/students/${defaults.id}` : '/admin/students'}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

function FieldError({ message }: { message: string }) {
  return <p className="mt-1 text-xs text-rose-600">{message}</p>;
}
