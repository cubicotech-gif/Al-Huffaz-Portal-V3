import { createClient } from '@/lib/supabase/server';
import { markAllReadAction } from '@/lib/notifications/actions';

export async function NotificationsList({ userId }: { userId: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('notifications')
    .select('id, title, message, type, is_read, created_at, related_type, related_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  const rows = data ?? [];
  const unread = rows.some((r) => !r.is_read);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-600">
          {rows.length === 0 ? 'No notifications yet.' : `Showing the latest ${rows.length}.`}
        </p>
        {unread ? (
          <form action={markAllReadAction}>
            <button
              type="submit"
              className="text-sm font-semibold text-brand-600 hover:underline"
            >
              Mark all read
            </button>
          </form>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-600">
          Your inbox is empty.
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((n) => (
            <li
              key={n.id}
              className={`rounded-xl border px-4 py-3 ${
                n.is_read
                  ? 'border-slate-200 bg-white'
                  : 'border-brand-200 bg-brand-50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                  <p className="mt-0.5 text-sm text-slate-600">{n.message}</p>
                </div>
                <span className="text-xs text-slate-500">
                  {new Date(n.created_at).toLocaleDateString()}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
