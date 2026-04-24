import { createClient } from '@/lib/supabase/server';

export const LIST_PAGE_SIZE = 20;

export type StudentListFilters = {
  q?: string;
  gradeLevel?: string;
  donationEligible?: 'true' | 'false';
  archived?: 'true' | 'false';
  page?: number;
};

export type StudentListRow = {
  id: string;
  full_name: string;
  gr_number: string | null;
  grade_level: string | null;
  gender: 'male' | 'female' | 'other' | null;
  islamic_category: 'hifz' | 'nazra' | 'qaidah' | 'none' | null;
  donation_eligible: boolean;
  is_sponsored: boolean;
  archived_at: string | null;
  photo_url: string | null;
  created_at: string;
};

export async function listStudents(filters: StudentListFilters) {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * LIST_PAGE_SIZE;
  const to = from + LIST_PAGE_SIZE - 1;

  let query = supabase
    .from('students')
    .select(
      'id, full_name, gr_number, grade_level, gender, islamic_category, donation_eligible, is_sponsored, archived_at, photo_url, created_at',
      { count: 'exact' },
    );

  if (filters.q) {
    const q = filters.q.trim();
    if (q) query = query.or(`full_name.ilike.%${q}%,gr_number.ilike.%${q}%`);
  }
  if (filters.gradeLevel) query = query.eq('grade_level', filters.gradeLevel);
  if (filters.donationEligible === 'true') query = query.eq('donation_eligible', true);
  if (filters.donationEligible === 'false') query = query.eq('donation_eligible', false);
  if (filters.archived === 'true') query = query.not('archived_at', 'is', null);
  else query = query.is('archived_at', null);

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    rows: (data ?? []) as StudentListRow[],
    total: count ?? 0,
    page,
    pageSize: LIST_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / LIST_PAGE_SIZE)),
  };
}

export async function getStudentById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('students').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

export async function signedPhotoUrl(path: string | null) {
  if (!path) return null;
  const supabase = await createClient();
  const { data } = await supabase.storage.from('student-photos').createSignedUrl(path, 60 * 10);
  return data?.signedUrl ?? null;
}
