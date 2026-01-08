import { sql } from '../../../../lib/neon';

export async function POST(req: Request) {
  const body = await req.json();
  const { clientId, olderThan } = body;

  if (!clientId || !olderThan) {
    return new Response(JSON.stringify({ error: 'Paramètres manquants' }), { status: 400 });
  }

  await sql`
    DELETE FROM wh_log
    WHERE client_id = ${clientId} AND created_at < ${olderThan}
  `;

  return new Response(JSON.stringify({ ok: true }));
}
