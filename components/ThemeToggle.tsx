"use client";
import { IconButton } from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import { useThemeMode } from "./Providers";
export default function ThemeToggle() {
  const { mode, toggleMode } = useThemeMode();
  return (
    <IconButton onClick={toggleMode} color="inherit">
      {mode === "light" ? <Brightness4Icon /> : <Brightness7Icon />}
    </IconButton>
  );
}
