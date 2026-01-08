import { sql } from '../../../lib/neon'; // ta connexion Neon centralisée

interface WebhookRequest {
  id: string;
  method: string;
  path: string;
  headers: any;
  body: string;
  created_at: string;
}

interface PageProps {
  params: { clientId: string };
}

// Liste des clients autorisés pour test
const allowedClients = ['titi', 'toto'];

export default async function Page(props: PageProps) {
  const params = await props.params; // ✅ params devient un objet réel
  const { clientId } = params;

  // Vérifie si le client est autorisé
  if (!allowedClients.includes(clientId)) {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <h1>Client non autorisé</h1>
        <p>Vous ne pouvez pas voir ces logs.</p>
      </div>
    );
  }

  // Récupère les 50 dernières requêtes pour ce client
const requests = (await sql`
  SELECT id, method, path, headers, body, created_at
  FROM wh_log
  WHERE client_id = ${clientId}
  ORDER BY created_at DESC
  LIMIT 50
`) as WebhookRequest[];

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Webhook logs for client: {clientId}</h1>
      {requests.length === 0 && <p>No requests found.</p>}
      {requests.map((req) => (
        <div key={req.id} style={{ border: '1px solid #ccc', marginBottom: '10px', padding: '10px' }}>
          <p>
            <strong>{req.method}</strong> {req.path} <em>({new Date(req.created_at).toLocaleString()})</em>
          </p>
          <pre style={{ background: '#f5f5f5', padding: '10px', overflowX: 'auto' }}>
            {JSON.stringify({ headers: req.headers, body: req.body }, null, 2)}
          </pre>
        </div>
      ))}
    </div>
  );
}
