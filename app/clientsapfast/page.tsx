import pool from '../../lib/db';

type Client = {
  id: number;
  tiers_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
};

export default async function ClientsPage() {
  let clients: Client[] = [];

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM clients ORDER BY id ASC');
    client.release();
    clients = result.rows;
  } catch (err) {
    console.error('Erreur récupération des clients:', err);
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Liste des clients</h1>
      {clients.length === 0 ? (
        <p>Aucun client trouvé.</p>
      ) : (
        <table className="table-auto border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 px-2">ID2</th>
              <th className="border border-gray-300 px-2">TIERS Y2</th>
              <th className="border border-gray-300 px-2">Prénom</th>
              <th className="border border-gray-300 px-2">Nom</th>
              <th className="border border-gray-300 px-2">Email</th>
              <th className="border border-gray-300 px-2">Téléphone</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(client => (
              <tr key={client.id}>
                <td className="border border-gray-300 px-2">{client.id}</td>
                <td className="border border-gray-300 px-2">{client.tiers_id}</td>
                <td className="border border-gray-300 px-2">{client.first_name}</td>
                <td className="border border-gray-300 px-2">{client.last_name}</td>
                <td className="border border-gray-300 px-2">{client.email}</td>
                <td className="border border-gray-300 px-2">{client.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}