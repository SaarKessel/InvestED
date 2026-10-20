import { createContext, useEffect } from "react";

export type Theme = "light" | "dark";

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

/**
 * InvestED is light-only: Saar picked the light gradient + wave background as
 * THE site background for every state (Oct 20). The theme API stays so
 * callers compile unchanged, but the theme is always light and any saved
 * dark preference is overwritten.
 */
export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    localStorage.setItem("theme", "light");
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme: "light",
        setTheme: () => {},
        toggleTheme: () => {},
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
