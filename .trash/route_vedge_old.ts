import { NextRequest, NextResponse } from 'next/server';
import { sql } from '../../../../lib/neon';
  // Sécurité minimale : UUID valide
  //if (!/^[0-9a-fA-F-]{36}$/.test(clientId)) {
  //  return NextResponse.json({ error: 'Invalid clientId' }, { status: 400 });
  //}

export const runtime = 'edge';

export async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> } // params est maintenant une Promise
) {
  const resolvedParams = await params;       // ✅ attendre la promesse
  const slug = resolvedParams.slug || [];

  const clientId = slug[0] || 'unknown';      // fallback pour clientId
  const path = '/' + slug.slice(1).filter(Boolean).join('/'); // fallback pour path

  // reste du code ...

  const body = await req.text();

  // Stocke la requête dans wh_log
  await sql`
    INSERT INTO wh_log (client_id, method, path, headers, body)
    VALUES (
      ${clientId},
      ${req.method},
      ${path},
      ${JSON.stringify(Object.fromEntries(req.headers))},
      ${body}
    )
  `;

  // Réponse générique
  return NextResponse.json({
    ok: true,
    clientId,
    method: req.method,
    path,
    message: 'Request received'
  });
}

// Toutes méthodes HTTP → même handler
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const OPTIONS = handler;
export const PATCH = handler;
