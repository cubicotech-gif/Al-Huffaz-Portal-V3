import { createClient } from '@/lib/supabase/server';

export async function listFees(studentId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('student_fees')
    .select('*')
    .eq('student_id', studentId)
    .order('academic_year', { ascending: false })
    .order('academic_term', { ascending: false, nullsFirst: false });
  return data ?? [];
}

export async function getFee(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('student_fees').select('*').eq('id', id).single();
  return data ?? null;
}

export async function listAcademics(studentId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('student_academics')
    .select('*')
    .eq('student_id', studentId)
    .order('academic_year', { ascending: false })
    .order('academic_term', { ascending: false });
  return data ?? [];
}

export async function getAcademics(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('student_academics').select('*').eq('id', id).single();
  return data ?? null;
}

export async function listBehavior(studentId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('student_behavior')
    .select('*')
    .eq('student_id', studentId)
    .order('academic_year', { ascending: false })
    .order('academic_term', { ascending: false });
  return data ?? [];
}

export async function getBehavior(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('student_behavior').select('*').eq('id', id).single();
  return data ?? null;
}
