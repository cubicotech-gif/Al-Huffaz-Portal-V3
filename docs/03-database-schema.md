# 03 — Database Schema

All tables are Postgres (Supabase). Money is stored in **minor units**
(paise for PKR) as `bigint` — never `float`. Timestamps are `timestamptz`
in UTC. Every table has `id uuid primary key default gen_random_uuid()`
unless noted.

## Enums

```sql
create type user_role as enum ('admin', 'staff', 'sponsor', 'pending_sponsor');

create type sponsorship_status as enum (
  'requested',    -- sponsor clicked "sponsor this student"
  'approved',     -- admin approved; awaiting first payment
  'active',       -- at least one payment verified
  'paused',       -- sponsor stopped paying; student still linked
  'cancelled',    -- sponsor withdrew
  'rejected'      -- admin rejected the request
);

create type payment_status as enum (
  'submitted',    -- sponsor submitted proof
  'verified',     -- admin verified receipt
  'rejected',     -- admin rejected (bad proof, wrong amount, etc.)
  'refunded'      -- edge case
);

create type payment_method as enum (
  'bank_transfer',
  'wire_transfer',
  'jazzcash',
  'easypaisa',
  'card',
  'other_international',
  'other'
);

create type gender as enum ('male', 'female', 'other');

create type islamic_category as enum ('hifz', 'nazra', 'qaidah', 'none');
```

## Core tables

### `profiles`
One row per Supabase Auth user. Supabase ships with `auth.users` — this
is our app-level extension.

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'pending_sponsor',
  full_name text not null,
  phone text,
  whatsapp text,
  country text,
  avatar_url text,
  is_active boolean not null default true,
  approved_at timestamptz,
  approved_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on profiles(role);
```

### `schools` (single row for MVP; prepared for multi-tenant)

```sql
create table schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  address text,
  currency text not null default 'PKR',
  currency_symbol text not null default 'Rs.',
  academic_year text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

### `students`

```sql
create table students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id),

  -- identity
  full_name text not null,
  gr_number text unique,
  roll_number text,
  gender gender,
  date_of_birth date,
  admission_date date,
  grade_level text,           -- kg1, kg2, class1, level2, shb, etc.
  islamic_category islamic_category default 'none',
  photo_url text,

  -- address
  permanent_address text,
  current_address text,

  -- family
  father_name text,
  father_cnic text,
  father_phone text,
  father_email text,
  guardian_name text,
  guardian_cnic text,
  guardian_phone text,
  guardian_whatsapp text,
  guardian_email text,
  relationship text,
  emergency_contact text,
  emergency_whatsapp text,

  -- health
  blood_group text,
  allergies text,
  medical_conditions text,
  health_rating smallint,     -- 1-5
  cleanness_rating smallint,  -- 1-5

  -- eligibility
  zakat_eligible boolean not null default false,
  donation_eligible boolean not null default false,

  -- sponsorship state (denormalized for listing perf; keep in sync)
  is_sponsored boolean not null default false,

  -- soft delete
  archived_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on students(grade_level);
create index on students(donation_eligible, is_sponsored) where donation_eligible;
create index on students(archived_at) where archived_at is null;
```

### `student_fees`

```sql
create table student_fees (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  academic_year text not null,
  academic_term text,

  monthly_fee bigint not null default 0,   -- in minor units (paise)
  course_fee bigint not null default 0,
  uniform_fee bigint not null default 0,
  annual_fee bigint not null default 0,
  admission_fee bigint not null default 0,

  created_at timestamptz not null default now(),
  unique (student_id, academic_year, academic_term)
);
```

### `student_attendance`

```sql
create table student_attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  academic_year text not null,
  academic_term text not null,
  total_school_days int not null default 0,
  present_days int not null default 0,
  created_at timestamptz not null default now(),
  unique (student_id, academic_year, academic_term)
);
```

### `student_academics`

```sql
create table student_academics (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  academic_year text not null,
  academic_term text not null,
  subjects jsonb not null default '[]'::jsonb,
    -- [{ name: "English", marks: 85, total: 100 }, ...]
  overall_percentage numeric(5,2),
  created_at timestamptz not null default now(),
  unique (student_id, academic_year, academic_term)
);
```

### `student_behavior`

```sql
create table student_behavior (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  academic_year text not null,
  academic_term text not null,
  homework_completion text,
  class_participation text,
  group_work text,
  problem_solving text,
  organization text,
  teacher_comments text,
  goals jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (student_id, academic_year, academic_term)
);
```

### `sponsors`
One row per approved sponsor user. Mirrors v2's "Sponsor CPT".

```sql
create table sponsors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references profiles(id) on delete cascade,
  display_name text not null,
  email text not null,
  phone text,
  whatsapp text,
  country text,
  account_status text not null default 'active',  -- active, paused, deleted
  approved_at timestamptz,
  reactivated_at timestamptz,
  account_deleted_at timestamptz,
  created_at timestamptz not null default now()
);
```

### `sponsorships`

```sql
create table sponsorships (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid not null references sponsors(id) on delete restrict,
  student_id uuid not null references students(id) on delete restrict,

  status sponsorship_status not null default 'requested',
  monthly_amount bigint not null,           -- minor units
  sponsorship_type text not null default 'monthly',  -- monthly, one_time, annual

  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references profiles(id),
  rejected_at timestamptz,
  rejected_by uuid references profiles(id),
  rejection_reason text,
  cancelled_at timestamptz,
  ended_at timestamptz,

  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on sponsorships(sponsor_id, status);
create index on sponsorships(student_id, status);
```

### `payments`

```sql
create table payments (
  id uuid primary key default gen_random_uuid(),
  sponsorship_id uuid not null references sponsorships(id) on delete restrict,
  sponsor_id uuid not null references sponsors(id),
  student_id uuid not null references students(id),

  amount bigint not null,               -- minor units
  payment_method payment_method not null,
  bank_name text,
  transaction_id text,
  payment_date date not null,

  status payment_status not null default 'submitted',
  proof_url text,                       -- storage path for screenshot
  notes text,

  verified_at timestamptz,
  verified_by uuid references profiles(id),
  rejected_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on payments(sponsorship_id);
create index on payments(sponsor_id, status);
create index on payments(status, created_at desc);
```

### `notifications`

```sql
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'info',    -- info, success, warning, error
  related_type text,                    -- sponsorship, payment, student, etc.
  related_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index on notifications(user_id, is_read, created_at desc);
```

### `activity_log`

```sql
create table activity_log (
  id bigserial primary key,
  actor_id uuid references profiles(id),
  action text not null,                 -- 'student.created', 'sponsorship.approved', ...
  object_type text not null,
  object_id uuid,
  details jsonb not null default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);
create index on activity_log(actor_id, created_at desc);
create index on activity_log(object_type, object_id);
```

## Row Level Security — policy summary

Enable RLS on every table: `alter table <name> enable row level security;`

### `profiles`
- Select: own row OR admin/staff.
- Update: own row (except `role`, `is_active`, `approved_*`) OR admin.
- Insert: handled by trigger on `auth.users` insert.

### `students`
- Select: admin/staff always; sponsor only for students linked via an
  `active`/`approved` sponsorship; public only when `donation_eligible
  and not is_sponsored` (via a dedicated `public_available_students`
  view exposing safe columns only).
- Insert/Update/Delete: admin/staff only.

### `sponsors`
- Select: own row; admin.
- Update: admin only.

### `sponsorships`
- Select: sponsor for their own; admin/staff.
- Insert: authenticated sponsor for themselves.
- Update: admin (status transitions); sponsor may cancel their own.

### `payments`
- Select: own sponsor; admin/staff.
- Insert: sponsor, linked to their own sponsorship only.
- Update: admin only (verify/reject).

### `notifications`
- Select / Update(is_read): own rows only.
- Insert: server-side only (service role).

### `activity_log`
- Select: admin only.
- Insert: server-side (service role or trigger).

Full policy SQL will live in `supabase/migrations/` once we begin
Phase 0. Keep this doc in sync when schemas change.

## Public views

`public_available_students` — safe columns for unauthenticated browsing
of donation-eligible unsponsored children. Columns: `id, full_name,
grade_level, islamic_category, photo_url, gender, monthly_fee_total`.

## Triggers

- `on auth.users insert` → insert `profiles` row with role
  `pending_sponsor` and full_name from metadata.
- `on sponsorships update` → when status flips to `approved`, set
  `students.is_sponsored = true`. When status flips to `cancelled`/`ended`
  and no other active sponsorships exist, set back to `false`.
- `on payments update` → when status flips to `verified` and this is the
  first verified payment for the sponsorship, flip sponsorship status
  to `active` (if currently `approved`).
