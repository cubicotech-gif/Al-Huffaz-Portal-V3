import { createClient } from '@/lib/supabase/server';

export type LogActivity = {
  action: string;
  objectType: string;
  objectId?: string | null;
  details?: Record<string, unknown>;
};

// Append an entry to activity_log using the caller's JWT. The
// activity_log_insert_self RLS policy enforces actor_id = auth.uid().
// Failures are swallowed — logging should never block a business
// action.
export async function logActivity({ action, objectType, objectId, details }: LogActivity) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('activity_log').insert({
      actor_id: user.id,
      action,
      object_type: objectType,
      object_id: objectId ?? null,
      details: details ?? {},
    });
  } catch (err) {
    console.warn('[activity] log failed', err);
  }
}
