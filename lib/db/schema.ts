import { sql } from 'drizzle-orm';
import {
  bigint,
  bigserial,
  boolean,
  date,
  index,
  inet,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

// Enums -------------------------------------------------------------------

export const userRoleEnum = pgEnum('user_role', [
  'admin',
  'staff',
  'sponsor',
  'pending_sponsor',
]);

export const sponsorshipStatusEnum = pgEnum('sponsorship_status', [
  'requested',
  'approved',
  'active',
  'paused',
  'cancelled',
  'rejected',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'submitted',
  'verified',
  'rejected',
  'refunded',
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'bank_transfer',
  'wire_transfer',
  'jazzcash',
  'easypaisa',
  'card',
  'other_international',
  'other',
]);

export const genderEnum = pgEnum('gender', ['male', 'female', 'other']);

export const islamicCategoryEnum = pgEnum('islamic_category', [
  'hifz',
  'nazra',
  'qaidah',
  'none',
]);

// profiles ----------------------------------------------------------------

export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey(),
    role: userRoleEnum('role').notNull().default('pending_sponsor'),
    fullName: text('full_name').notNull(),
    phone: text('phone'),
    whatsapp: text('whatsapp'),
    country: text('country'),
    avatarUrl: text('avatar_url'),
    isActive: boolean('is_active').notNull().default(true),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    approvedBy: uuid('approved_by'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    roleIdx: index('profiles_role_idx').on(t.role),
  }),
);

// schools -----------------------------------------------------------------

export const schools = pgTable('schools', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  currency: text('currency').notNull().default('PKR'),
  currencySymbol: text('currency_symbol').notNull().default('Rs.'),
  academicYear: text('academic_year'),
  settings: jsonb('settings').notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// students ----------------------------------------------------------------

export const students = pgTable(
  'students',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    schoolId: uuid('school_id')
      .notNull()
      .references(() => schools.id),

    fullName: text('full_name').notNull(),
    grNumber: text('gr_number').unique(),
    rollNumber: text('roll_number'),
    gender: genderEnum('gender'),
    dateOfBirth: date('date_of_birth'),
    admissionDate: date('admission_date'),
    gradeLevel: text('grade_level'),
    islamicCategory: islamicCategoryEnum('islamic_category').default('none'),
    photoUrl: text('photo_url'),

    permanentAddress: text('permanent_address'),
    currentAddress: text('current_address'),

    fatherName: text('father_name'),
    fatherCnic: text('father_cnic'),
    fatherPhone: text('father_phone'),
    fatherEmail: text('father_email'),
    guardianName: text('guardian_name'),
    guardianCnic: text('guardian_cnic'),
    guardianPhone: text('guardian_phone'),
    guardianWhatsapp: text('guardian_whatsapp'),
    guardianEmail: text('guardian_email'),
    relationship: text('relationship'),
    emergencyContact: text('emergency_contact'),
    emergencyWhatsapp: text('emergency_whatsapp'),

    bloodGroup: text('blood_group'),
    allergies: text('allergies'),
    medicalConditions: text('medical_conditions'),
    healthRating: smallint('health_rating'),
    cleannessRating: smallint('cleanness_rating'),

    zakatEligible: boolean('zakat_eligible').notNull().default(false),
    donationEligible: boolean('donation_eligible').notNull().default(false),
    isSponsored: boolean('is_sponsored').notNull().default(false),

    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    gradeIdx: index('students_grade_level_idx').on(t.gradeLevel),
  }),
);

// per-term student tables -------------------------------------------------

export const studentFees = pgTable(
  'student_fees',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    academicYear: text('academic_year').notNull(),
    academicTerm: text('academic_term'),
    monthlyFee: bigint('monthly_fee', { mode: 'bigint' }).notNull().default(0n),
    courseFee: bigint('course_fee', { mode: 'bigint' }).notNull().default(0n),
    uniformFee: bigint('uniform_fee', { mode: 'bigint' }).notNull().default(0n),
    annualFee: bigint('annual_fee', { mode: 'bigint' }).notNull().default(0n),
    admissionFee: bigint('admission_fee', { mode: 'bigint' }).notNull().default(0n),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    unique: uniqueIndex('student_fees_unique').on(t.studentId, t.academicYear, t.academicTerm),
  }),
);

export const studentAttendance = pgTable(
  'student_attendance',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    academicYear: text('academic_year').notNull(),
    academicTerm: text('academic_term').notNull(),
    totalSchoolDays: integer('total_school_days').notNull().default(0),
    presentDays: integer('present_days').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    unique: uniqueIndex('student_attendance_unique').on(t.studentId, t.academicYear, t.academicTerm),
  }),
);

export const studentAcademics = pgTable(
  'student_academics',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    academicYear: text('academic_year').notNull(),
    academicTerm: text('academic_term').notNull(),
    subjects: jsonb('subjects').notNull().default(sql`'[]'::jsonb`),
    overallPercentage: numeric('overall_percentage', { precision: 5, scale: 2 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    unique: uniqueIndex('student_academics_unique').on(t.studentId, t.academicYear, t.academicTerm),
  }),
);

export const studentBehavior = pgTable(
  'student_behavior',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    academicYear: text('academic_year').notNull(),
    academicTerm: text('academic_term').notNull(),
    homeworkCompletion: text('homework_completion'),
    classParticipation: text('class_participation'),
    groupWork: text('group_work'),
    problemSolving: text('problem_solving'),
    organization: text('organization'),
    teacherComments: text('teacher_comments'),
    goals: jsonb('goals').notNull().default(sql`'[]'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    unique: uniqueIndex('student_behavior_unique').on(t.studentId, t.academicYear, t.academicTerm),
  }),
);

// sponsors / sponsorships / payments --------------------------------------

export const sponsors = pgTable('sponsors', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  profileId: uuid('profile_id')
    .notNull()
    .unique()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  displayName: text('display_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  whatsapp: text('whatsapp'),
  country: text('country'),
  accountStatus: text('account_status').notNull().default('active'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  reactivatedAt: timestamp('reactivated_at', { withTimezone: true }),
  accountDeletedAt: timestamp('account_deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const sponsorships = pgTable(
  'sponsorships',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    sponsorId: uuid('sponsor_id')
      .notNull()
      .references(() => sponsors.id, { onDelete: 'restrict' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'restrict' }),
    status: sponsorshipStatusEnum('status').notNull().default('requested'),
    monthlyAmount: bigint('monthly_amount', { mode: 'bigint' }).notNull(),
    sponsorshipType: text('sponsorship_type').notNull().default('monthly'),
    requestedAt: timestamp('requested_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    approvedBy: uuid('approved_by').references(() => profiles.id),
    rejectedAt: timestamp('rejected_at', { withTimezone: true }),
    rejectedBy: uuid('rejected_by').references(() => profiles.id),
    rejectionReason: text('rejection_reason'),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    sponsorStatusIdx: index('sponsorships_sponsor_status_idx').on(t.sponsorId, t.status),
    studentStatusIdx: index('sponsorships_student_status_idx').on(t.studentId, t.status),
  }),
);

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    sponsorshipId: uuid('sponsorship_id')
      .notNull()
      .references(() => sponsorships.id, { onDelete: 'restrict' }),
    sponsorId: uuid('sponsor_id')
      .notNull()
      .references(() => sponsors.id),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id),
    amount: bigint('amount', { mode: 'bigint' }).notNull(),
    paymentMethod: paymentMethodEnum('payment_method').notNull(),
    bankName: text('bank_name'),
    transactionId: text('transaction_id'),
    paymentDate: date('payment_date').notNull(),
    status: paymentStatusEnum('status').notNull().default('submitted'),
    proofUrl: text('proof_url'),
    notes: text('notes'),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    verifiedBy: uuid('verified_by').references(() => profiles.id),
    rejectedReason: text('rejected_reason'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    sponsorshipIdx: index('payments_sponsorship_idx').on(t.sponsorshipId),
    sponsorStatusIdx: index('payments_sponsor_status_idx').on(t.sponsorId, t.status),
    queueIdx: index('payments_queue_idx').on(t.status, t.createdAt),
  }),
);

// notifications / activity_log -------------------------------------------

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    message: text('message').notNull(),
    type: text('type').notNull().default('info'),
    relatedType: text('related_type'),
    relatedId: uuid('related_id'),
    isRead: boolean('is_read').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    inboxIdx: index('notifications_inbox_idx').on(t.userId, t.isRead, t.createdAt),
  }),
);

export const activityLog = pgTable(
  'activity_log',
  {
    id: bigserial('id', { mode: 'bigint' }).primaryKey(),
    actorId: uuid('actor_id').references(() => profiles.id),
    action: text('action').notNull(),
    objectType: text('object_type').notNull(),
    objectId: uuid('object_id'),
    details: jsonb('details').notNull().default(sql`'{}'::jsonb`),
    ipAddress: inet('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    actorIdx: index('activity_log_actor_idx').on(t.actorId, t.createdAt),
    objectIdx: index('activity_log_object_idx').on(t.objectType, t.objectId),
  }),
);

// Inferred types ---------------------------------------------------------

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Student = typeof students.$inferSelect;
export type Sponsor = typeof sponsors.$inferSelect;
export type Sponsorship = typeof sponsorships.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
