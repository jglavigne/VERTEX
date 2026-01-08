// styles/theme.js
import { createTheme } from "@mui/material/styles";

export const getTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      primary: { main: "#1976d2" },
      secondary: { main: "#f50057" },
      background: {
        default: mode === "light" ? "#f4f6f8" : "#0b0724ff",
        paper: mode === "light" ? "#fff" : "#772424ff",
      },
      text: {
        primary: mode === "light" ? "#000" : "#fff",
        secondary: mode === "light" ? "#555" : "#ddd",
      },
    },

    typography: {
      fontFamily: "Roboto, Arial, sans-serif",
      h4: { fontWeight: 700 },
    },

    shape: { borderRadius: 8 },

    components: {
    // MuiCssBaseline: {
    //   styleOverrides: {
    //     body: {
    //       lineHeight: 1.3, // ✅ Override le line-height par défaut
    //     },
    //   },
    // },
      // ---- TABLE HEAD ----
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: mode === "light" ? "#f0f0f0" : "#26265eff",
          },
        },
      },

      // ---- CELLES DU HEAD ----
      MuiTableCell: {
        styleOverrides: {
          head: {
            // backgroundColor: mode === "light" ? "#e3e9f2" : "#dfe7b8",
            color: mode === "light" ? "#000" : "#fff",
            fontWeight: 700,
            fontSize: "0.95rem",
          },
          root: {
            padding: "4px 8px",
          },
        },
      },

      // ---- SORT LABEL (tri) ----
      MuiTableSortLabel: {
        styleOverrides: {
          root: {
            color: mode === "light" ? "#000" : "#772424ff",

            "&:hover": {
              color: mode === "light" ? "#71b3e9" : "#71b3e9",
            },

            "&.Mui-active": {
              color: mode === "light" ? "#90caf9" : "#90caf9",
            },
          },

          icon: {
            color: mode === "light" ? "#247749ff !important" : "#247749ff !important",

            "&.Mui-active": {
              color: "#90caf9 !important",
            },
          },
        },
      },
            // -------- TableRow (hover lignes) --------
      MuiTableBody: {
        styleOverrides: {
          root: {
            "& .MuiTableRow-root:hover": {
              backgroundColor: mode === "light" ? "#d9e6f7" : "#9999b1ff",
              "& .MuiTableCell-root": {
                color: mode === "light" ? "#000" : "#fff",
              },
            },
          },
        },
      },
    },
  });
