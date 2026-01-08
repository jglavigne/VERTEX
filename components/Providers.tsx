"use client";

import React, { useState, useEffect, useMemo, createContext, useContext } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { getTheme } from "../styles/theme";
import Topbar from "../components/Topbar";

export const ThemeContext = createContext({
  mode: "light" as "light" | "dark",
  toggleMode: () => {},
});

export const useThemeMode = () => useContext(ThemeContext);

export default function Providers({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedMode = localStorage.getItem("themeMode");
    if (savedMode === "light" || savedMode === "dark") {
      setMode(savedMode);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("themeMode", mode);
  }, [mode]);

  const theme = useMemo(() => getTheme(mode), [mode]);

  const toggleMode = () => {
    setMode(prev => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Topbar />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}