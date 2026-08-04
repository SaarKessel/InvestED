import { createContext } from "react";

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


export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {

  const toggleTheme = () => {};

  return (
    <ThemeContext.Provider
      value={{
        theme: "light",
        setTheme: () => {},
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

