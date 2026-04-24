import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { toCsv } from '@/lib/csv';
import { logActivity } from '@/lib/activity';

export const runtime = 'edge';

export async function GET() {
  await requireRole(['admin', 'staff']);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('students')
    .select(
      'id, full_name, gr_number, roll_number, gender, date_of_birth, admission_date, grade_level, islamic_category, donation_eligible, zakat_eligible, is_sponsored, archived_at, father_name, guardian_name, guardian_phone, permanent_address, blood_group, created_at',
    )
    .order('created_at', { ascending: false });
  if (error) return new Response(error.message, { status: 500 });

  const csv = toCsv(data ?? [], [
    { key: 'id', header: 'id' },
    { key: 'full_name', header: 'full_name' },
    { key: 'gr_number', header: 'gr_number' },
    { key: 'roll_number', header: 'roll_number' },
    { key: 'gender', header: 'gender' },
    { key: 'date_of_birth', header: 'date_of_birth' },
    { key: 'admission_date', header: 'admission_date' },
    { key: 'grade_level', header: 'grade_level' },
    { key: 'islamic_category', header: 'islamic_category' },
    { key: 'donation_eligible', header: 'donation_eligible' },
    { key: 'zakat_eligible', header: 'zakat_eligible' },
    { key: 'is_sponsored', header: 'is_sponsored' },
    { key: 'archived_at', header: 'archived_at' },
    { key: 'father_name', header: 'father_name' },
    { key: 'guardian_name', header: 'guardian_name' },
    { key: 'guardian_phone', header: 'guardian_phone' },
    { key: 'permanent_address', header: 'permanent_address' },
    { key: 'blood_group', header: 'blood_group' },
    { key: 'created_at', header: 'created_at' },
  ]);

  await logActivity({ action: 'export.students', objectType: 'students' });

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="students-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
