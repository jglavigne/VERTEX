'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';


interface WebhookRequest {
  id: string;
  method: string;
  path: string;
  headers: any;
  body: string;
  created_at: string;
}

interface Props {
  requests: WebhookRequest[];
  clientId: string;
}

const PAGE_SIZE = 20;

export default function RequestBin({ requests, clientId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams() as URLSearchParams;
  const [selected, setSelected] = useState<WebhookRequest | null>(null);
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [days, setDays] = useState(Number(searchParams.get('days') ?? 7));
  const [page, setPage] = useState(Number(searchParams.get('page') ?? 1));
  const [collapseHeaders, setCollapseHeaders] = useState(true);
  const [collapseBody, setCollapseBody] = useState(false);

// // URL → state
// useEffect(() => {
//   setSearch(searchParams.get('search') ?? '');
//   setDays(Number(searchParams.get('days') ?? 7));
//   setPage(Number(searchParams.get('page') ?? 1));
// }, [searchParams]);

// state → URL
useEffect(() => {
  const params = new URLSearchParams();

  if (search) params.set('search', search);
  params.set('days', String(days));
  params.set('page', String(page));

  router.replace(`?${params.toString()}`, { scroll: false });
}, [search, days, page, router]);

  // Filtrer par recherche et date
  const filtered = useMemo(() => {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return requests.filter(r => {
      const inDate = new Date(r.created_at) >= since;
      const inSearch =
        r.path.toLowerCase().includes(search.toLowerCase()) ||
        r.method.toLowerCase().includes(search.toLowerCase()) ||
        JSON.stringify(r.body).toLowerCase().includes(search.toLowerCase()) ||
        JSON.stringify(r.headers).toLowerCase().includes(search.toLowerCase());
      return inDate && inSearch;
    });
  }, [requests, search, days]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Supprimer les éléments plus vieux que X jours
  const deleteOlder = async (olderThanDays: number) => {
    if (!confirm(`Supprimer toutes les requêtes de plus de ${olderThanDays} jours ?`)) return;
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - olderThanDays);

    try {
      await fetch(`/api/webhook/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, olderThan: sinceDate.toISOString() }),
      });
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la suppression.');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
      {/* Zone gauche : liste */}


 <div style={{ width: '25%', borderRight: '1px solid #ccc', display: 'flex', flexDirection: 'column', height: '100vh' }}>
  {/* Partie haute fixe */}
  <div style={{ padding: '10px', flex: '0 0 auto', background: '#f9f9f9' }}>
     <input
      type="text"
      placeholder="Recherche (path, method, body, headers)"
      value={search}
      onChange={e => { setSearch(e.target.value); setPage(1); }}
      style={{ width: '100%', padding: '5px', marginBottom: '5px' }}
    />
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <label>
        Derniers jours:{' '}
        <input
          type="number"
          value={days}
          min={1}
          max={365}
          onChange={e => { setDays(Number(e.target.value)); setPage(1); }}
          style={{ width: '50px' }}
        />
      </label>
        ({filtered.length})
      {/* Pagination */}
      {pageCount > 1 && (
        <div>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>◀</button>
          <span> {page} / {pageCount} </span>
          <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount}>▶</button>
        </div>
      )}
    </div>
          <button
          onClick={() => router.refresh()}
          style={{ marginBottom: '10px', padding: '5px 10px', cursor: 'pointer' }}
        >
          Rafraîchir
        </button>

        <button
          onClick={() => {
            const olderThan = parseInt(prompt('Supprimer les requêtes plus anciennes que X jours ? (entrez un nombre)') || '0', 10);
            if (olderThan > -1) deleteOlder(olderThan);
          }}
          style={{ marginBottom: '10px', padding: '5px 10px', cursor: 'pointer', background: '#f55', color: 'white' }}
        >
          Supprimer anciens
        </button>
    </div>

  {/* Liste scrollable */}
  <div style={{ flex: '1 1 auto', overflowY: 'auto', padding: '10px' }}>
    {paginated.map(req => (
      <div
        key={req.id}
        onClick={() => setSelected(req)}
        style={{
          padding: '5px',
          marginBottom: '5px',
          border: selected?.id === req.id ? '2px solid #0070f3' : '1px solid #ddd',
          cursor: 'pointer',
          backgroundColor: selected?.id === req.id ? '#e6f0ff' : 'white',
        }}
      >
        <strong>{req.method}</strong> {req.path}
        <br />
        <small>{new Date(req.created_at).toLocaleString()}</small>
      </div>
    ))}
  </div>

    </div>

      {/* Zone droite : détails */}
      <div style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
        {!selected ? (
          <div>Sélectionnez une requête à gauche</div>
        ) : (
          <>
            <em>{new Date(selected.created_at).toLocaleString()}</em> : {selected.method} {selected.path}
            <div style={{ background: '#edf5e7ff', marginBottom: '10px'}}>
              Headers{' '}
              <button onClick={() => setCollapseHeaders(c => !c)} style={{ marginLeft: '5px' }}>
                {collapseHeaders ? 'Afficher' : 'Masquer'}
              </button>

            {!collapseHeaders && (
              <pre style={{  margin: 0, overflowX: 'auto', maxHeight: '70vh' }}>
                {JSON.stringify(selected.headers, null, 2)}
              </pre>
            )}
            </div>

            <div style={{ background: '#eef'}}>
              Body{' '}
              <button onClick={() => setCollapseBody(c => !c)} style={{ marginLeft: '5px' }}>
                {collapseBody ? 'Afficher' : 'Masquer'}
              </button>

            {!collapseBody && (
              <pre style={{  margin: 0, overflow: 'auto' }}>
                {(() => {
                    const parsed = parseBody(selected.body);
                    return typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2);
                })()}
              </pre>
            )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function parseBody(body: any) {
  if (!body) return null;

  if (typeof body === 'object') return body;

  if (typeof body === 'string') {
    try {
      const first = JSON.parse(body);

      // Cas double-encodé
      if (typeof first === 'string') {
        return JSON.parse(first);
      }

      return first;
    } catch {
      return body;
    }
  }

  return body;
}
