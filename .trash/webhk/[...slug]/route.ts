import { NextRequest, NextResponse } from 'next/server';
import { sql } from '../../../../lib/neon';

export const runtime = 'nodejs';

function corsHeaders(req: NextRequest) {
  const origin = req.headers.get('origin');

  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Gateway-Apikey, X-Debug-Name, X-Debug-Target, X-Debug-Result',
    'Access-Control-Allow-Credentials': origin ? 'true' : 'false',
    'Vary': 'Origin'
  };
}

export async function handler(
  req: NextRequest,
  { params }: { params: { slug?: string[] } }
) {
  const headers = corsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers });
  }

  const slug = params.slug ?? [];
  const clientId = slug[0] ?? 'unknown';
  const path = '/' + slug.slice(1).filter(Boolean).join('/');

  const body = await req.text();

  try {
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

    return NextResponse.json(
      { ok: true, clientId, method: req.method, path, message: 'Request received' },
      { headers }
    );
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { ok: false, error: 'Internal error' },
      { status: 500, headers }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const OPTIONS = handler;
export const PATCH = handler;
