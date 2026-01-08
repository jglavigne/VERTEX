import { NextRequest, NextResponse } from 'next/server';
import { sql } from '../../../../lib/neon';
import Pusher from "pusher";

// ✅ Variable pour activer/désactiver Pusher
const PUSHER_ENABLED = process.env.PUSHER_ENABLED === 'true';

let pusher: Pusher | null = null;

// ✅ Initialiser Pusher uniquement si activé
if (PUSHER_ENABLED) {
  if (!process.env.PUSHER_APP_ID || !process.env.PUSHER_KEY || !process.env.PUSHER_SECRET || !process.env.PUSHER_CLUSTER) {
    console.warn("Pusher is enabled but missing environment variables");
  } else {
    pusher = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
      useTLS: true,
    });
  }
}

function handleCors(req: NextRequest) {
  const origin = req.headers.get('origin') ?? '*';
  const headers = {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Gateway-Apikey, X-Debug-Name, X-Debug-Target, X-Debug-Result',
    'Access-Control-Allow-Credentials': origin ? 'true' : 'false',
    'Vary': 'Origin'
  };
  return headers;
}

export async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  const corsHeaders = handleCors(req);

  if (req.method === 'OPTIONS') {
     return new NextResponse(null, { status: 204, headers: corsHeaders });
  }
  
  const resolvedParams = await params;
  const slug = resolvedParams.slug || [];
  const clientId = slug[0] || 'unknown';
  const path = '/' + slug.slice(1).filter(Boolean).join('/');
  const searchParams = new URL(req.url).searchParams;
  const queryParamsObj = Object.fromEntries(searchParams);
  const body = await req.text();

  const result = await sql`
    INSERT INTO wh_log (client_id, method, path, qparams, headers, body)
    VALUES (
      ${clientId},
      ${req.method},
      ${path},
      ${JSON.stringify(queryParamsObj)},
      ${JSON.stringify(Object.fromEntries(req.headers))},
      ${body}
    )
    RETURNING id
  `;
  const whLogId = result[0].id;

  // ✅ Envoi à Pusher uniquement si activé
  if (PUSHER_ENABLED && pusher) {
    try {
      await pusher.trigger(
        "presence-webhook",
        "wh_log_created",
        { id: whLogId }
      );
    } catch (error) {
      console.error("Pusher error:", error);
      // Continue sans bloquer la requête
    }
  }

  return NextResponse.json({
    ok: true,
    clientId,
    method: req.method,
    path,
    message: 'Request received'
  }, { headers: corsHeaders });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const OPTIONS = handler;
export const PATCH = handler;