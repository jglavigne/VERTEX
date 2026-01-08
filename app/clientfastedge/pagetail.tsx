
"use client";

import { useState, useEffect, useMemo, useRef } from "react";

type Client = {
  id: number;
  tiers_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
};

type SortConfig = {
  key: keyof Client;
  direction: "asc" | "desc";
};

// 1) Constante stable en dehors du composant
const COLUMNS = [
  "id",
  "tiers_id",
  "first_name",
  "last_name",
  "email",
  "phone",
] as const;

function sortClients(clients: Client[], config: SortConfig) {
  return [...clients].sort((a, b) => {
    const aValue = a[config.key];
    const bValue = b[config.key];

    // Numérique
    if (typeof aValue === "number" && typeof bValue === "number") {
      return config.direction === "asc" ? aValue - bValue : bValue - aValue;
    }
    if (typeof aValue === "number" || typeof bValue === "number") {
      const an = Number(aValue ?? Number.NEGATIVE_INFINITY);
      const bn = Number(bValue ?? Number.NEGATIVE_INFINITY);
      return config.direction === "asc" ? an - bn : bn - an;
    }

    // Chaîne (tolérant à undefined/null)
    const aStr = (aValue ?? "").toString();
    const bStr = (bValue ?? "").toString();
    return config.direction === "asc"
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr);
  });
}

export default function ClientsTable() {
  console.count("ClientsTable render"); // pour visualiser les renders

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "id",
    direction: "asc",
  });
  const [data, setData] = useState<Client[]>([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);

  // 2) Log "columns" une seule fois côté client (même en StrictMode)
  const loggedColumns = useRef(false);
  useEffect(() => {
    if (!loggedColumns.current) {
      console.log("columns:", COLUMNS);
      loggedColumns.current = true;
    }
  }, []);

  // 3) Empêcher double fetch en dev (StrictMode)
  const fetchedOnce = useRef(false);

  useEffect(() => {
    if (fetchedOnce.current) return;
    fetchedOnce.current = true;

    const abort = new AbortController();

    (async () => {
      try {
        const response = await fetch("/api/clientfastedge", {
          signal: abort.signal,
        });
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const clients: Client[] = await response.json();
        console.log("Données récupérées :", clients);

        const saved = localStorage.getItem("clientSort");
        if (saved) {
          const parsed = JSON.parse(saved) as {
            key: string;
            direction: string;
          };

          const validKeys = COLUMNS as unknown as Array<keyof Client>;
          const validDir = ["asc", "desc"] as const;
          const isValid =
            validKeys.includes(parsed.key as keyof Client) &&
            validDir.includes(parsed.direction as "asc" | "desc");

          const effectiveSort: SortConfig = isValid
            ? {
                key: parsed.key as keyof Client,
                direction: parsed.direction as "asc" | "desc",
              }
            : { key: "id", direction: "asc" };

          setSortConfig(effectiveSort);
          setData(sortClients(clients, effectiveSort));
        } else {
          setData(sortClients(clients, sortConfig));
        }
      } catch (error) {
        if ((error as any)?.name !== "AbortError") {
          console.error("Erreur lors du fetch :", error);
        }
      } finally {
        setLoading(false);
        setReady(true);
      }
    })();

    return () => {
      abort.abort();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sortBy = (key: keyof Client) => {
    const direction =
      sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    const newConfig: SortConfig = { key, direction };
    setSortConfig(newConfig);
    setData(sortClients(data, newConfig));
    localStorage.setItem("clientSort", JSON.stringify(newConfig));
  };

  const getArrow = (key: keyof Client) =>
    sortConfig.key === key ? (sortConfig.direction === "asc" ? "▲" : "▼") : "";

  if (!ready) return null;
  if (loading) return <p>Chargement des clients...</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Liste des clients</h1>
      <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            {COLUMNS.map((key) => (
              <th
                key={key}
                onClick={() => sortBy(key as keyof Client)}
                className="cursor-pointer px-4 py-2 text-left hover:bg-gray-200 transition"
              >
                {String(key).toUpperCase()} {getArrow(key as keyof Client)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50 transition">
              {COLUMNS.map((key) => (
                <td key={key} className="border-t px-4 py-2">
                  {row[key as keyof Client]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
