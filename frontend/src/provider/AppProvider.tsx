import { ReactNode, useEffect, useState } from "react";
import { AppContext, type ThemeMode } from "@/context";
import { SileoOptions, Toaster } from "sileo";

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

  const styleToast: Partial<SileoOptions> = {
    fill: "#171717",
    position: "top-right",
    duration: 2000,
    styles: {
      title: "text-white!",
      description: "text-white/75!",
    },
  };

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
            ? { ...styleToast }
            : { duration: 2000, styles: { description: "text-gray-600" } }
        }
      />
    </AppContext.Provider>
  );
};
