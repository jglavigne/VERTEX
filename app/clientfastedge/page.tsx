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
  Grid,
  Avatar,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import EditIcon from "@mui/icons-material/Edit";
import { useRouter } from "next/navigation";
//import { Client } from "pg";

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

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md")); // sm = <600px

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
  //  if (fetchedOnce.current) return;
  //  fetchedOnce.current = true;
  //if (fetchedOnce.current && data.length > 0) return;
 console.count("ClientsTable fetchedOnce"); // pour visualiser les renders


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
        fetchedOnce.current = true; // Marque comme fetché seulement après succès

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

  const handlePageChange = (_: unknown, newPage: number) => {
    setPage(newPage);
  };
    const router = useRouter();

  const handleRowClick = async (row: Client) => {
    // Récupère la valeur de la colonne souhaitée
    const tiersId = row.id;

    // Navigue vers la page "clientDetails" en passant tiersId en query param
    router.push(`/clients?tiersId=${encodeURIComponent(tiersId)}`);

    //  const searchParams = useSearchParams();
//  const tiersId = searchParams.get("tiersId");

    // try {
    //   const response = await fetch("/api/clients", {
    //     method: "GET",
    //     headers: { "Content-Type": "application/json" },
    //   //  body: JSON.stringify({ tiersId }),
    //   });

    //   const result = await response.json();
    //   console.log("Résultat API :", result);
    // } catch (err) {
    //   console.error("Erreur fetch API :", err);
    // }
  };

  if (!ready) return null;
  if (loading) return <Typography>Chargement des clients...</Typography>;

  // Découpage des données pour la pagination
  const paginatedData = data.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ p: 2, maxWidth: "98%", mx: "auto" }}>
      <Typography variant="h4" fontWeight="bold" textAlign="center" mb={4}>
        Liste des clients
      </Typography>

      {!isMobile ? (
        // ✅ Version Desktop : Tableau classique
        <TableContainer
          component={Paper}
          sx={{ borderRadius: 2, overflow: "auto", maxHeight: 500 }}
        >
          <Table size="small">
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
                <TableRow
                  key={row.id}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => handleRowClick(row)}
                >
                  {COLUMNS.map((key) => (
                    <TableCell key={key}>{row[key]}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        // ✅ Version Mobile : Cards style CRM
        <Grid container spacing={2}>
          {paginatedData.map((row) => (
            <Grid size={{ xs: 12 }} key={row.id}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: 6,
                    transform: "translateY(-4px)",
                  },
                  backgroundColor: theme.palette.background.paper,
                }}
              >
                <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                  {row.first_name?.charAt(0) || "?"}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" fontWeight="bold">
                    {row.first_name} {row.last_name}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mt: 0.5,
                    }}
                  >
                    <EmailIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {row.email || "N/A"}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mt: 0.5,
                    }}
                  >
                    <PhoneIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {row.phone || "N/A"}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    ID : {row.id} | Tiers : {row.tiers_id || "N/A"}
                  </Typography>
                </Box>
                <IconButton color="primary" size="small">
                  <EditIcon />
                </IconButton>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Pagination */}
      <Box mt={2}>
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
    </Box>
  );
}
