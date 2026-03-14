import { ReactNode, useEffect, useState } from "react";

import { AppContext, type ThemeMode } from "@/context";

interface AppProviderProps {
  children: ReactNode; 
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [isSideOpen, setIsSideOpen] = useState<boolean>(false);

  const [theme, setTheme] = useState<ThemeMode>(
    localStorage.getItem("theme")
      ? (localStorage.getItem("theme") as ThemeMode)
      : "dark",
  );

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  useEffect(() => {
    const html = document.querySelector("html");
    if (html) {
      html.setAttribute("data-theme", theme!);
      localStorage.setItem("theme", theme!);
    }
  }, [theme]);

  const toggleSide = () => {
    setIsSideOpen(!isSideOpen);
  };

  return (
    <AppContext.Provider
      value={{ isSideOpen, toggleSide, themeMode: theme, toggleTheme }}
    >
      {children}
    </AppContext.Provider>
  );
};
