"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type ThemeChoice = "light" | "dark";
export const THEME_KEY = "th-theme";

const Ctx = createContext<{
  choice: ThemeChoice;
  setChoice: (c: ThemeChoice) => void;
} | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Server + first client render use "dark" (matches the no-flash script's
  // default); the stored choice is hydrated on mount.
  const [choice, setChoiceState] = useState<ThemeChoice>("dark");

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored === "light" || stored === "dark") setChoiceState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", choice);
  }, [choice]);

  const setChoice = useCallback((c: ThemeChoice) => {
    try {
      localStorage.setItem(THEME_KEY, c);
    } catch {
      /* ignore */
    }
    setChoiceState(c);
  }, []);

  return <Ctx.Provider value={{ choice, setChoice }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
