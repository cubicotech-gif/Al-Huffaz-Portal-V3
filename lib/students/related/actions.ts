'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/activity';
import {
  academicsFormSchema,
  attendanceFormSchema,
  behaviorFormSchema,
  feeFormSchema,
} from '@/lib/students/related/schema';

export type RelatedFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  savedAt?: number;
};

function collectFieldErrors(
  issues: { path: (string | number)[]; message: string }[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) out[issue.path.join('.')] = issue.message;
  return out;
}

// Fees --------------------------------------------------------------------

export async function saveFeeAction(
  studentId: string,
  feeId: string | null,
  _prev: RelatedFormState,
  formData: FormData,
): Promise<RelatedFormState> {
  const parsed = feeFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: 'Please fix the highlighted fields.', fieldErrors: collectFieldErrors(parsed.error.issues) };
  }

  const supabase = await createClient();
  if (feeId) {
    const { error } = await supabase.from('student_fees').update(parsed.data).eq('id', feeId);
    if (error) return { error: error.message };
    await logActivity({ action: 'student_fee.updated', objectType: 'student_fee', objectId: feeId });
  } else {
    const { error } = await supabase
      .from('student_fees')
      .insert({ student_id: studentId, ...parsed.data });
    if (error) return { error: error.message };
    await logActivity({ action: 'student_fee.created', objectType: 'student_fee', objectId: studentId });
  }

  revalidatePath(`/admin/students/${studentId}/fees`);
  if (feeId) redirect(`/admin/students/${studentId}/fees`);
  return { savedAt: Date.now() };
}

export async function deleteFeeAction(studentId: string, id: string, _formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from('student_fees').delete().eq('id', id);
  if (error) throw new Error(error.message);
  await logActivity({ action: 'student_fee.deleted', objectType: 'student_fee', objectId: id });
  revalidatePath(`/admin/students/${studentId}/fees`);
}

// Academics ---------------------------------------------------------------

export async function saveAcademicsAction(
  studentId: string,
  academicsId: string | null,
  _prev: RelatedFormState,
  formData: FormData,
): Promise<RelatedFormState> {
  const parsed = academicsFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: 'Please fix the highlighted fields.', fieldErrors: collectFieldErrors(parsed.error.issues) };
  }

  const supabase = await createClient();
  const payload = {
    academic_year: parsed.data.academic_year,
    academic_term: parsed.data.academic_term,
    subjects: parsed.data.subjects,
    overall_percentage: parsed.data.overall_percentage,
  };

  if (academicsId) {
    const { error } = await supabase.from('student_academics').update(payload).eq('id', academicsId);
    if (error) return { error: error.message };
    await logActivity({
      action: 'student_academics.updated',
      objectType: 'student_academics',
      objectId: academicsId,
    });
  } else {
    const { error } = await supabase
      .from('student_academics')
      .insert({ student_id: studentId, ...payload });
    if (error) return { error: error.message };
    await logActivity({
      action: 'student_academics.created',
      objectType: 'student_academics',
      objectId: studentId,
    });
  }

  revalidatePath(`/admin/students/${studentId}/academics`);
  if (academicsId) redirect(`/admin/students/${studentId}/academics`);
  return { savedAt: Date.now() };
}

export async function deleteAcademicsAction(studentId: string, id: string, _formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from('student_academics').delete().eq('id', id);
  if (error) throw new Error(error.message);
  await logActivity({ action: 'student_academics.deleted', objectType: 'student_academics', objectId: id });
  revalidatePath(`/admin/students/${studentId}/academics`);
}

// Behavior ----------------------------------------------------------------

export async function saveBehaviorAction(
  studentId: string,
  behaviorId: string | null,
  _prev: RelatedFormState,
  formData: FormData,
): Promise<RelatedFormState> {
  const parsed = behaviorFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: 'Please fix the highlighted fields.', fieldErrors: collectFieldErrors(parsed.error.issues) };
  }

  const supabase = await createClient();
  const payload = {
    academic_year: parsed.data.academic_year,
    academic_term: parsed.data.academic_term,
    homework_completion: parsed.data.homework_completion,
    class_participation: parsed.data.class_participation,
    group_work: parsed.data.group_work,
    problem_solving: parsed.data.problem_solving,
    organization: parsed.data.organization,
    teacher_comments: parsed.data.teacher_comments,
    goals: parsed.data.goals,
  };

  if (behaviorId) {
    const { error } = await supabase.from('student_behavior').update(payload).eq('id', behaviorId);
    if (error) return { error: error.message };
    await logActivity({
      action: 'student_behavior.updated',
      objectType: 'student_behavior',
      objectId: behaviorId,
    });
  } else {
    const { error } = await supabase
      .from('student_behavior')
      .insert({ student_id: studentId, ...payload });
    if (error) return { error: error.message };
    await logActivity({
      action: 'student_behavior.created',
      objectType: 'student_behavior',
      objectId: studentId,
    });
  }

  revalidatePath(`/admin/students/${studentId}/behavior`);
  if (behaviorId) redirect(`/admin/students/${studentId}/behavior`);
  return { savedAt: Date.now() };
}

export async function deleteBehaviorAction(studentId: string, id: string, _formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from('student_behavior').delete().eq('id', id);
  if (error) throw new Error(error.message);
  await logActivity({ action: 'student_behavior.deleted', objectType: 'student_behavior', objectId: id });
  revalidatePath(`/admin/students/${studentId}/behavior`);
}

// Attendance --------------------------------------------------------------

export async function saveAttendanceAction(
  studentId: string,
  attendanceId: string | null,
  _prev: RelatedFormState,
  formData: FormData,
): Promise<RelatedFormState> {
  const parsed = attendanceFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: 'Please fix the highlighted fields.', fieldErrors: collectFieldErrors(parsed.error.issues) };
  }
  if (parsed.data.present_days > parsed.data.total_school_days) {
    return { error: 'Present days cannot exceed total school days.' };
  }

  const supabase = await createClient();
  if (attendanceId) {
    const { error } = await supabase
      .from('student_attendance')
      .update(parsed.data)
      .eq('id', attendanceId);
    if (error) return { error: error.message };
    await logActivity({
      action: 'student_attendance.updated',
      objectType: 'student_attendance',
      objectId: attendanceId,
    });
  } else {
    const { error } = await supabase
      .from('student_attendance')
      .insert({ student_id: studentId, ...parsed.data });
    if (error) return { error: error.message };
    await logActivity({
      action: 'student_attendance.created',
      objectType: 'student_attendance',
      objectId: studentId,
    });
  }

  revalidatePath(`/admin/students/${studentId}/attendance`);
  if (attendanceId) redirect(`/admin/students/${studentId}/attendance`);
  return { savedAt: Date.now() };
}

export async function deleteAttendanceAction(studentId: string, id: string, _formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from('student_attendance').delete().eq('id', id);
  if (error) throw new Error(error.message);
  await logActivity({
    action: 'student_attendance.deleted',
    objectType: 'student_attendance',
    objectId: id,
  });
  revalidatePath(`/admin/students/${studentId}/attendance`);
}
