import { ReactNode, useEffect, useState } from "react";
import { Toaster } from "sileo";

import { AppContext, type ThemeMode } from "@/context";
import { sileoStyleToast } from "@/libs/sileo";

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

      <Toaster
        options={
          theme === "light"
            ? { ...sileoStyleToast }
            : {
                duration: sileoStyleToast.duration,
                styles: { description: "text-gray-600" },
              }
        }
      />
    </AppContext.Provider>
  );
};
