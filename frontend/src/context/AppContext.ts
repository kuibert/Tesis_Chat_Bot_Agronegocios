import { createContext } from "react";

export type ThemeMode = "dark" | "light" | "system";
export interface AppContextType {
  themeMode: ThemeMode;
  isSideOpen: boolean;
  toggleSide: () => void;
  toggleTheme: () => void;
}

export const AppContext = createContext<AppContextType>({
  themeMode: "dark",
  isSideOpen: false,
  toggleSide: () => {},
  toggleTheme: () => {},
});
