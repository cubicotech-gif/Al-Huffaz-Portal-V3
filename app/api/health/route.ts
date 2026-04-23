export const runtime = 'edge';

export async function GET() {
  return Response.json({
    status: 'ok',
    service: 'al-huffaz-portal-v3',
    timestamp: new Date().toISOString(),
  });
}
