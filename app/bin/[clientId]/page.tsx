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
}

const allowedClients = ['titi', 'toto','VM'];

export default async function Page({ params }: PageProps) {
  const { clientId } = await params;

  // if (!allowedClients.includes(clientId)) {
  //   return <div style={{ padding: '20px' }}>Client non autorisé</div>;
  // }

  const since = new Date();
  since.setDate(since.getDate() - 7);

  const requests = (await sql`
    SELECT id, method, path, qparams, headers, body, created_at
    FROM wh_log
    WHERE client_id = ${clientId} AND created_at >= ${since.toISOString()}
    ORDER BY created_at DESC
    LIMIT 500
  `) as WebhookRequest[];

  return <RequestBin requests={requests} clientId={clientId} />;
}
