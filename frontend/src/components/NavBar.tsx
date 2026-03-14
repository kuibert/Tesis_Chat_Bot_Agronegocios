import { PanelLeftOpen, PanelLeftClose, Sun, Moon } from "lucide-react";

import { useApp } from "@/hooks/useApp";

type NavProps = React.ComponentProps<"nav">;

interface NavBarProps extends NavProps {}

export function NavBar({ ...props }: NavBarProps) {
  const { isSideOpen , toggleTheme, themeMode} = useApp();

  return (
    <nav {...props}>
      <div className="flex items-center justify-between w-full">
        <label
          htmlFor="my-drawer-4"
          aria-label="open sidebar"
          className="btn btn-square btn-ghost "
        >
          {isSideOpen ? (
            <PanelLeftClose className="size-4" />
          ) : (
            <PanelLeftOpen className="size-4" />
          )}
        </label>

        <div className="px-4">Navbar Title</div>

        <label className="swap swap-rotate btn btn-sm">
          <input type="checkbox" onChange={() => toggleTheme()} />

          <Sun className="swap-on size-4" />
          <Moon className="swap-off size-4" />
        </label>
      </div>
    </nav>
  );
}
