import { NextRequest, NextResponse } from 'next/server';
import { sql } from '../../../../lib/neon';

export const runtime = 'nodejs';

const POLL_TIMEOUT = 25000; // 25 secondes
const CHECK_INTERVAL = 1000; // Vérifie toutes les 1 seconde

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const since = searchParams.get('since');
  const clientId = searchParams.get('clientId');

  // Validation
  if (!since) {
    return NextResponse.json(
      { error: 'Missing "since" parameter' },
      { status: 400 }
    );
  }

  const startTime = Date.now();

  // Boucle de long polling
  while (Date.now() - startTime < POLL_TIMEOUT) {
    try {
      // Interroger la DB
      let query;
      if (clientId) {
        query = await sql`
          SELECT * FROM wh_log 
          WHERE created_at > ${since} AND client_id = ${clientId}
          ORDER BY created_at DESC 
          LIMIT 50
        `;
      } else {
        query = await sql`
          SELECT * FROM wh_log 
          WHERE created_at > ${since}
          ORDER BY created_at DESC 
          LIMIT 50
        `;
      }

      // Si nouveaux logs trouvés → retourner immédiatement
      if (query.length > 0) {
        return NextResponse.json({
          logs: query,
          count: query.length,
          timestamp: new Date().toISOString()
        });
      }

      // Attendre 1 seconde avant de revérifier
      await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));

      // Vérifier si le client a annulé la requête
      if (req.signal.aborted) {
        return NextResponse.json({ logs: [], cancelled: true });
      }

    } catch (error) {
      console.error('Error in long polling:', error);
      return NextResponse.json(
        { error: 'Internal error' },
        { status: 500 }
      );
    }
  }

  // Timeout atteint → retourner vide
  return NextResponse.json({
    logs: [],
    count: 0,
    timeout: true,
    timestamp: new Date().toISOString()
  });
}