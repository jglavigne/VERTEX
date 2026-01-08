'use client';

import { useEffect, useState } from 'react';

type Client = {
  id: number;
  tiers_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
 const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
     setReady(true);
   fetch('/api/clients')
      .then(res => res.json())
      .then(data => {
        setClients(data);
        setLoading(false);
      })
      .finally(() => setLoading(false))
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);
  
if (!ready) return null; // Evite le mismatch
if (loading) return <p>Chargement des clients...</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Liste des clients</h1>
      <table className="table-auto border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 px-2">ID</th>
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
              <td className="border border-gray-300 px-2">{client.first_name}</td>
              <td className="border border-gray-300 px-2">{client.last_name}</td>
              <td className="border border-gray-300 px-2">{client.email}</td>
              <td className="border border-gray-300 px-2">{client.phone}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}