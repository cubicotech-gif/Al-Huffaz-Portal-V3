import { createClient } from '@/lib/supabase/server';

export type SponsorListFilters = {
  q?: string;
  status?: 'active' | 'paused' | 'deleted' | 'all';
};

export type SponsorListRow = {
  id: string;
  profile_id: string;
  display_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  account_status: string;
  approved_at: string | null;
  account_deleted_at: string | null;
  created_at: string;
  active_count: number;
};

export async function listSponsors(filters: SponsorListFilters): Promise<SponsorListRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from('sponsors')
    .select(
      'id, profile_id, display_name, email, phone, country, account_status, approved_at, account_deleted_at, created_at',
    );

  if (filters.status && filters.status !== 'all') {
    query = query.eq('account_status', filters.status);
  }
  if (filters.q) {
    const q = filters.q.trim();
    if (q) query = query.or(`display_name.ilike.%${q}%,email.ilike.%${q}%`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;

  const sponsors = data ?? [];
  if (sponsors.length === 0) return [];

  const ids = sponsors.map((s) => s.id);
  const { data: active } = await supabase
    .from('sponsorships')
    .select('sponsor_id')
    .in('sponsor_id', ids)
    .in('status', ['approved', 'active', 'paused']);

  const counts = new Map<string, number>();
  for (const row of active ?? []) {
    counts.set(row.sponsor_id as string, (counts.get(row.sponsor_id as string) ?? 0) + 1);
  }

  return sponsors.map((s) => ({ ...s, active_count: counts.get(s.id) ?? 0 }) as SponsorListRow);
}

export async function getSponsorDetail(id: string) {
  const supabase = await createClient();
  const { data: sponsor, error } = await supabase
    .from('sponsors')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !sponsor) return null;

  const [{ data: sponsorships }, { data: payments }] = await Promise.all([
    supabase
      .from('sponsorships')
      .select('id, status, monthly_amount, requested_at, student:students(id, full_name, grade_level)')
      .eq('sponsor_id', id)
      .order('requested_at', { ascending: false }),
    supabase
      .from('payments')
      .select('id, amount, status, payment_date, created_at, student:students(full_name)')
      .eq('sponsor_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  return {
    sponsor,
    sponsorships: sponsorships ?? [],
    payments: payments ?? [],
  };
}
