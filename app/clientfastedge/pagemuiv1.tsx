"use client";

import { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableSortLabel,
  TablePagination,
} from "@mui/material";

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

    if (typeof aValue === "number" && typeof bValue === "number") {
      return config.direction === "asc" ? aValue - bValue : bValue - aValue;
    }

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

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);

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

    return () => abort.abort();
  }, []);

  const sortBy = (key: keyof Client) => {
    const direction =
      sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    const newConfig: SortConfig = { key, direction };
    setSortConfig(newConfig);
    setData(sortClients(data, newConfig));
    localStorage.setItem("clientSort", JSON.stringify(newConfig));
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  
useEffect(() => {
  const savedRows = localStorage.getItem("rowsPerPage");
  if (savedRows) {
    setRowsPerPage(parseInt(savedRows, 10));
  }
}, []);

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
  const newRows = parseInt(event.target.value, 10);
  setRowsPerPage(newRows);
  setPage(0);
  localStorage.setItem("rowsPerPage", newRows.toString());
  };

  if (!ready) return null;
  if (loading) return <Typography>Chargement des clients...</Typography>;

  // Découpage des données pour la pagination
  const paginatedData = data.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ p: 6, maxWidth: "768px", mx: "auto" }}>
      <Typography variant="h4" fontWeight="bold" textAlign="center" mb={4}>
        Liste des clients
      </Typography>

      <TableContainer
        component={Paper}
        sx={{ borderRadius: 2, overflow: "hidden" }}
      >
        <Table>
          <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
            <TableRow>
              {COLUMNS.map((key) => (
                <TableCell
                  key={key}
                  sortDirection={
                    sortConfig.key === key ? sortConfig.direction : false
                  }
                >
                  <TableSortLabel
                    active={sortConfig.key === key}
                    direction={
                      sortConfig.key === key ? sortConfig.direction : "asc"
                    }
                    onClick={() => sortBy(key)}
                  >
                    {String(key).toUpperCase()}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedData.map((row) => (
              <TableRow key={row.id} hover>
                {COLUMNS.map((key) => (
                  <TableCell key={key}>{row[key]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={data.length}
        page={page}
        onPageChange={handlePageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleRowsPerPageChange}
        labelRowsPerPage="Lignes par page"
      />
    </Box>
  );
}
