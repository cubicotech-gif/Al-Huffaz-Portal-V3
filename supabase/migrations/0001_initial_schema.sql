-- 0001_initial_schema.sql
-- Creates all enums, core tables, indexes, and the single-school seed row.
-- Row-level security, triggers and public views are added in later migrations.

-- Enums --------------------------------------------------------------------

create type user_role as enum ('admin', 'staff', 'sponsor', 'pending_sponsor');

create type sponsorship_status as enum (
  'requested',
  'approved',
  'active',
  'paused',
  'cancelled',
  'rejected'
);

create type payment_status as enum (
  'submitted',
  'verified',
  'rejected',
  'refunded'
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


-- profiles -----------------------------------------------------------------

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
create index profiles_role_idx on profiles(role);


-- schools ------------------------------------------------------------------

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

-- Seed the single school row for MVP. The UUID is fixed so that app code
-- can reference it by `SCHOOL_ID` until multi-tenant is introduced.
insert into schools (id, name)
values ('00000000-0000-0000-0000-000000000001', 'Al-Huffaz Islamic School');


-- students -----------------------------------------------------------------

create table students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id),

  full_name text not null,
  gr_number text unique,
  roll_number text,
  gender gender,
  date_of_birth date,
  admission_date date,
  grade_level text,
  islamic_category islamic_category default 'none',
  photo_url text,

  permanent_address text,
  current_address text,

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

  blood_group text,
  allergies text,
  medical_conditions text,
  health_rating smallint,
  cleanness_rating smallint,

  zakat_eligible boolean not null default false,
  donation_eligible boolean not null default false,
  is_sponsored boolean not null default false,

  archived_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index students_grade_level_idx on students(grade_level);
create index students_available_idx on students(donation_eligible, is_sponsored)
  where donation_eligible;
create index students_active_idx on students(archived_at) where archived_at is null;


-- per-term student tables --------------------------------------------------

create table student_fees (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  academic_year text not null,
  academic_term text,

  monthly_fee bigint not null default 0,
  course_fee bigint not null default 0,
  uniform_fee bigint not null default 0,
  annual_fee bigint not null default 0,
  admission_fee bigint not null default 0,

  created_at timestamptz not null default now(),
  unique (student_id, academic_year, academic_term)
);

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

create table student_academics (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  academic_year text not null,
  academic_term text not null,
  subjects jsonb not null default '[]'::jsonb,
  overall_percentage numeric(5,2),
  created_at timestamptz not null default now(),
  unique (student_id, academic_year, academic_term)
);

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


-- sponsors / sponsorships / payments ---------------------------------------

create table sponsors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references profiles(id) on delete cascade,
  display_name text not null,
  email text not null,
  phone text,
  whatsapp text,
  country text,
  account_status text not null default 'active',
  approved_at timestamptz,
  reactivated_at timestamptz,
  account_deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table sponsorships (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid not null references sponsors(id) on delete restrict,
  student_id uuid not null references students(id) on delete restrict,

  status sponsorship_status not null default 'requested',
  monthly_amount bigint not null,
  sponsorship_type text not null default 'monthly',

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
create index sponsorships_sponsor_status_idx on sponsorships(sponsor_id, status);
create index sponsorships_student_status_idx on sponsorships(student_id, status);

create table payments (
  id uuid primary key default gen_random_uuid(),
  sponsorship_id uuid not null references sponsorships(id) on delete restrict,
  sponsor_id uuid not null references sponsors(id),
  student_id uuid not null references students(id),

  amount bigint not null,
  payment_method payment_method not null,
  bank_name text,
  transaction_id text,
  payment_date date not null,

  status payment_status not null default 'submitted',
  proof_url text,
  notes text,

  verified_at timestamptz,
  verified_by uuid references profiles(id),
  rejected_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_sponsorship_idx on payments(sponsorship_id);
create index payments_sponsor_status_idx on payments(sponsor_id, status);
create index payments_queue_idx on payments(status, created_at desc);


-- notifications / activity_log --------------------------------------------

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'info',
  related_type text,
  related_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_inbox_idx on notifications(user_id, is_read, created_at desc);

create table activity_log (
  id bigserial primary key,
  actor_id uuid references profiles(id),
  action text not null,
  object_type text not null,
  object_id uuid,
  details jsonb not null default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);
create index activity_log_actor_idx on activity_log(actor_id, created_at desc);
create index activity_log_object_idx on activity_log(object_type, object_id);


-- updated_at trigger helper ------------------------------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

create trigger students_set_updated_at
  before update on students
  for each row execute function set_updated_at();

create trigger sponsorships_set_updated_at
  before update on sponsorships
  for each row execute function set_updated_at();

create trigger payments_set_updated_at
  before update on payments
  for each row execute function set_updated_at();
