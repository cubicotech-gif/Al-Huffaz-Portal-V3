// Minimal Resend client over fetch (edge-compatible — no SDK needed).
// No-ops if RESEND_API_KEY is not configured, so flows keep working in dev.

type EmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendEmail({ to, subject, text, html }: EmailInput): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!key || !from) return;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, text, html }),
    });
    if (!res.ok) {
      // Keep the flow alive — log for the server console only.
      console.warn('[resend] send failed', res.status, await res.text());
    }
  } catch (err) {
    console.warn('[resend] send threw', err);
  }
}
