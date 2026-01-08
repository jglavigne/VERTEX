"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Pusher from "pusher-js";
import styles from './RequestBin.module.css'; // ✅ AJOUTER CETTE LIGNE

interface WebhookRequest {
  id: string;
  method: string;
  path: string;
  qparams: any;
  headers: any;
  body: string;
  created_at: string;
}

interface Props {
  requests: WebhookRequest[];
  clientId: string;
}

const PAGE_SIZE = 20;

function formatDateStable(dateString: string) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}


function parseBody(body: any) {
  if (!body) return null;

  if (typeof body === "object") return body;

  if (typeof body === "string") {
    try {
      const first = JSON.parse(body);

      // Cas double-encodé
      if (typeof first === "string") {
        return JSON.parse(first);
      }

      return first;
    } catch {
      return body;
    }
  }

  return body;
}


export default function RequestBin({ requests: initialRequests, clientId }: Props) {
  const [requests, setRequests] = useState(initialRequests); // Maintenant modifiable
  const router = useRouter();
  const searchParams = useSearchParams() as URLSearchParams;
  const [selected, setSelected] = useState<WebhookRequest | null>(null);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [days, setDays] = useState(Number(searchParams.get("days") ?? 7));
  const [page, setPage] = useState(Number(searchParams.get("page") ?? 1));
  const [collapseHeaders, setCollapseHeaders] = useState(true);
  const [collapseBody, setCollapseBody] = useState(false);
  const [collapseDebugResult, setCollapseDebugResult] = useState(true);

  // ✅ NOUVEAUX ÉTATS
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [liveRequests, setLiveRequests] = useState<WebhookRequest[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pusherInstance, setPusherInstance] = useState<Pusher | null>(null); // ✅ NOUVEAU
  const liveRequestsRef = useRef(liveRequests);
  const requestsRef = useRef(requests);
  useEffect(() => {
    liveRequestsRef.current = liveRequests;
  }, [liveRequests]);

  useEffect(() => {
    requestsRef.current = requests;
  }, [requests]);

useEffect(() => {
  setRequests(initialRequests);
  setLiveRequests([]); // ✅ Vider les logs temps réel aussi
  setIsRefreshing(false);
}, [initialRequests]);

  // state → URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("days", String(days));
    params.set("page", String(page));
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [search, days, page, router]);

// PUSHER (remplace le long polling)
useEffect(() => {
  if (!isLiveMode) {
    // Nettoyer Pusher si on désactive le mode
    if (pusherInstance) {
      pusherInstance.unsubscribe("presence-webhook");
      pusherInstance.disconnect();
      setPusherInstance(null);
    }
    return;
  }

  // Initialiser Pusher avec authentification
  const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    authEndpoint: "/api/pusher-auth",
    auth: {
      params: {
        user_id: clientId,
      },
    },
  });

  setPusherInstance(pusher);

  // S'abonner au canal presence
  const channel = pusher.subscribe("presence-webhook");

  // Écouter l'événement
  channel.bind("wh_log_created", async (data: { id: string }) => {
    try {
      // Récupérer le timestamp du log le plus récent
      const allLogs = [...liveRequestsRef.current, ...requestsRef.current];
      let lastTimestamp;
      if (allLogs[0]?.created_at) {
        const date = new Date(allLogs[0].created_at);
        date.setMilliseconds(date.getMilliseconds() + 1);
        lastTimestamp = date.toISOString();
      } else {
        const date = new Date();
        date.setHours(date.getHours() - 1);
        lastTimestamp = date.toISOString();
      }

      // Utiliser l'API existante
      const res = await fetch(
        `/api/webhook/wait?since=${encodeURIComponent(lastTimestamp)}&clientId=${clientId}`
      );

      if (!res.ok) throw new Error('Failed to fetch logs');

      const responseData = await res.json();

console.log('📥 Pusher event received:', {
  pusherEventId: data.id,
  apiResponse: responseData,
  logsCount: responseData.logs?.length || 0,
  logs: responseData.logs
});

      // Si nouveaux logs
      if (responseData.logs && responseData.logs.length > 0) {
        setLiveRequests(prev => [...responseData.logs, ...prev]);
        setSelected(responseData.logs[0]);
      }

    } catch (err) {
      console.error("Error fetching new logs:", err);
    }
  });

  // Cleanup
  return () => {
    channel.unbind("wh_log_created");
    pusher.unsubscribe("presence-webhook");
    pusher.disconnect();
  };
}, [isLiveMode, clientId]);

// ✅ FONCTION DE SUPPRESSION
  const deleteRequest = async (id: string) => {
 //   if (!confirm("Supprimer ce log ?")) return;

    try {
      const res = await fetch(`/api/webhook/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Suppression échouée");
     
      // Trouver l'index de l'élément supprimé dans la liste filtrée
      const indexInFiltered = filtered.findIndex(r => r.id === id);

    // Calculer le prochain élément à sélectionner
    let nextSelected: WebhookRequest | null = null;
    
    if (filtered.length > 1) {
      // Si on supprime le premier
      if (indexInFiltered === 0) {
        nextSelected = filtered[1]; // Le suivant devient le nouveau premier
      } 
      // Si on supprime le dernier
      else if (indexInFiltered === filtered.length - 1) {
        nextSelected = filtered[indexInFiltered - 1]; // Celui d'avant
      }
      // Si on supprime au milieu
      else {
        nextSelected = filtered[indexInFiltered+1]; // Même position (l'élément suivant prendra cette place)
      }
    }


      // Retirer des listes initiale + live
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setLiveRequests((prev) => prev.filter((r) => r.id !== id));
      setSelected(nextSelected);


    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression");
    }
  };

  // ✅ COMBINER LES LOGS (live + initiaux)
  const allRequests = useMemo(() => {
    return [...liveRequests, ...requests];
  }, [liveRequests, requests]);

  // Filtrer par recherche et date
  const filtered = useMemo(() => {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return allRequests.filter((r) => {
      const inDate = new Date(r.created_at) >= since;
      const inSearch =
        r.path.toLowerCase().includes(search.toLowerCase()) ||
        r.method.toLowerCase().includes(search.toLowerCase()) ||
        JSON.stringify(r.body).toLowerCase().includes(search.toLowerCase()) ||
        JSON.stringify(r.headers).toLowerCase().includes(search.toLowerCase());
      return inDate && inSearch;
    });
  }, [allRequests, search, days]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Supprimer les éléments plus vieux que X jours
  const deleteOlder = async (olderThanDays: number) => {
    if (
      !confirm(
        `Supprimer toutes les requêtes de plus de ${olderThanDays} jours ?`
      )
    )
      return;
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - olderThanDays);

    try {
      await fetch(`/api/webhook/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, olderThan: sinceDate.toISOString() }),
      });
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression.");
    }
  };

  return (
  <div className={styles.container}>
    {/* Zone gauche : liste */}
    <div className={styles.leftPanel}>
      {/* Partie haute fixe */}
      <div className={styles.topControls}>
        <input
          type="text"
          placeholder="Recherche (path, method, body, headers)"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className={styles.searchInput}
        />
        
        <div className={styles.filtersRow}>
          <label>
            Derniers jours:{" "}
            <input
              type="number"
              value={days}
              min={1}
              max={365}
              onChange={(e) => {
                setDays(Number(e.target.value));
                setPage(1);
              }}
            />
          </label>
          ({filtered.length})
          {/* Pagination */}
          {pageCount > 1 && (
            <div>
              <button
                className={styles.paginationBtn}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ◀
              </button>
              <span> {page} / {pageCount} </span>
              <button
                className={styles.paginationBtn}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={page === pageCount}
              >
                ▶
              </button>
            </div>
          )}
        </div>

        <div className={styles.buttonsRow}>
          <button
            onClick={() => {
              setIsLiveMode(false); 
              setIsRefreshing(true);
              router.refresh();
            }}
            disabled={isRefreshing}
            className={`${styles.btn} ${styles.btnRefresh}`}
          >
            {isRefreshing ? '⏳ Chargement...' : '🔄 Rafraîchir'}
          </button>

          <button
            onClick={() => setIsLiveMode(!isLiveMode)}
            className={`${styles.btn} ${isLiveMode ? styles.btnLiveActive : styles.btnLive}`}
          >
            {isLiveMode ? '🟢 Temps réel' : '⚪ Temps réel'}
          </button>

          <button
            onClick={() => {
              const olderThan = parseInt(prompt('Supprimer les requêtes plus anciennes que X jours ? (entrez un nombre)') || '0', 10);
              if (olderThan > -1) deleteOlder(olderThan);
            }}
            className={`${styles.btn} ${styles.btnDelete}`}
          >
            🗑️ Supprimer
          </button>
        </div>
      </div>
      
      {/* Liste scrollable */}
      <div className={styles.listScroll}>
        {paginated.map((req) => (
          <div
            key={req.id}
            onClick={() => setSelected(req)}
            className={`${styles.listItem} ${selected?.id === req.id ? styles.listItemSelected : ''}`}
          >
            <strong>{req.method}</strong> <small>{formatDateStable(req.created_at)}</small>
            <br />
            {req.path}
            
          </div>
        ))}
      </div>
    </div>

    {/* Zone droite : détails */}
    <div className={styles.rightPanel}>
      {!selected ? (
        <div className={styles.emptyState}>Sélectionnez une requête à gauche</div>
      ) : (
        <>
      {/* <div style={{ background: 'yellow', padding: '10px', marginBottom: '10px', fontSize: '11px' }}>
        <strong>🐛 DEBUG :</strong>
        <pre style={{ overflow: 'auto', maxHeight: '200px' }}>
          {JSON.stringify(selected, null, 2)}
        </pre>
      </div> */}

          <div className={styles.detailsHeader}>
            <div className={styles.detailsTitle}>
              <em>{formatDateStable(selected.created_at)}</em> <small>{selected.id}</small> :{" "}
              {selected.method} {selected.path} 
            </div>

            <button
              onClick={() => deleteRequest(selected.id)}
              className={styles.btnDeleteDetail}
            >
              🗑️ Supprimer
            </button>
          </div>

{(selected.headers['x-debug-name'] || 
  selected.headers['x-debug-target'] || 
  selected.headers['x-debug-result']) && (
  <div className={styles.debugSection}>
    {/* Tout sur une ligne */}
    <div className={styles.debugSingleLine}>
      {selected.headers['x-debug-result'] && (
        <button
          onClick={() => setCollapseDebugResult((c) => !c)}
          className={styles.btnToggle}
        >
          {collapseDebugResult ? "Result" : "Masquer"}
        </button>
      )}
      {selected.headers['x-debug-name'] && (
        <span className={styles.debugName}>
          {selected.headers['x-debug-name']}
        </span>
      )}
      {selected.headers['x-debug-target'] && (
        <span className={styles.debugTarget}>
          {selected.headers['x-debug-target']}
        </span>
      )}
    </div>

    {/* Result collapsible */}
    {selected.headers['x-debug-result'] && !collapseDebugResult && (
      <pre className={styles.debugResult}>
        {(() => {
          try {
            return JSON.stringify(JSON.parse(selected.headers['x-debug-result']), null, 2);
          } catch {
            return selected.headers['x-debug-result'];
          }
        })()}
      </pre>
    )}
  </div>
)}
      {selected.qparams && Object.keys(selected.qparams).length > 0 && (
        <div className={styles.queryParamsSection}>
           <div className={styles.queryParamsList}>
            {Object.entries(selected.qparams).filter(([key]) => key !== 'slug').map(([key, value]) => (
              <code key={key} className={styles.queryParams}>
                {key}={String(value)}
              </code>
            ))}
          </div>
        </div>
      )}

          <div className={`${styles.section} ${styles.sectionHeaders}`}>
            <button
              onClick={() => setCollapseHeaders((c) => !c)}
              className={styles.btnToggle}
            >
              {collapseHeaders ? "Afficher" : "Masquer"}
            </button>
            <span className={styles.sectionTitle}>Headers</span>
             {!collapseHeaders && (
              <pre className={styles.sectionContent}>
                {JSON.stringify(selected.headers, null, 2)}
              </pre>
            )}
         </div>

          <div className={`${styles.section} ${styles.sectionBody}`}>
            <button
              onClick={() => setCollapseBody((c) => !c)}
              className={styles.btnToggle}
            >
              {collapseBody ? "Afficher" : "Masquer"}
            </button>
            <span className={styles.sectionTitle}>Body</span>
            {!collapseBody && (
              <pre className={styles.sectionContentBody}>
                {(() => {
                  const parsed = parseBody(selected.body);
                  return typeof parsed === "string"
                    ? parsed
                    : JSON.stringify(parsed, null, 2);
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
