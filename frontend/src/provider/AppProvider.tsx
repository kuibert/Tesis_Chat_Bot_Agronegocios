import { ReactNode, useEffect, useState } from "react";
import { AppContext, type ThemeMode } from "@/context";

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [isSideOpen, setIsSideOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem("sidebar");
    return saved ? JSON.parse(saved) : false;
  });

  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("theme");
    return saved ? (saved as ThemeMode) : "dark";
  });

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  const toggleSide = () => {
    setIsSideOpen((prev) => !prev);
  };

  useEffect(() => {
    const html = document.querySelector("html");
    if (html) {
      html.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("sidebar", JSON.stringify(isSideOpen));
  }, [isSideOpen]);

  return (
    <AppContext.Provider
      value={{
        isSideOpen,
        toggleSide,
        themeMode: theme,
        toggleTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
