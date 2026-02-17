import { sql } from '../../../lib/neon';
import RequestBin from './RequestBin';


interface WebhookRequest {
  id: string;
  method: string;
  path: string;
  qparams: any;
  headers: any;
  body: string;
  created_at: string;
}

interface PageProps {
  params: { clientId: string };
  searchParams: { limit?: string; searchPath?: string; [key: string]: string | undefined };
}

const allowedClients = ['titi', 'toto','VM'];

export default async function Page({ params, searchParams }: PageProps) {
  const { clientId } = await params;
  const sp = await searchParams;
  const limit = Math.min(20000, Math.max(100, Number(sp?.limit ?? 500)));
  const searchPath = sp?.searchPath ?? "";

  // if (!allowedClients.includes(clientId)) {
  //   return <div style={{ padding: '20px' }}>Client non autorisé</div>;
  // }

  const since = new Date();
  since.setDate(since.getDate() - 7);

const requests = (await sql`
    SELECT id, method, path, qparams, headers, body, created_at
    FROM wh_log
    WHERE client_id = ${clientId}
      AND created_at >= ${since.toISOString()}
      ${searchPath ? sql`AND path ILIKE ${'%' + searchPath + '%'}` : sql``}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `) as WebhookRequest[];

  return <RequestBin requests={requests} clientId={clientId} />;
}
