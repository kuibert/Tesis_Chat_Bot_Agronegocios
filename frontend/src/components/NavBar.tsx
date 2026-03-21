import {
  PanelLeftOpen,
  PanelLeftClose,
  Sun,
  Moon,
  UserPlus,
} from "lucide-react";
import { Link } from "react-router";

import { useApp } from "@/hooks/useApp";
import { useAuth } from "@/hooks/useAuth";

type NavProps = React.ComponentProps<"nav">;

interface NavBarProps extends NavProps {}

export function NavBar({ ...props }: NavBarProps) {
  const { isSideOpen, toggleTheme } = useApp();
  const { hasSession } = useAuth(); 

 
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

        <div className="px-4">Agro - Chat</div>

        {!hasSession && (
          <div className="flex flex-row gap-2 justify-center items-center">
            <Link to={"sign-in"} className="btn btn-sm">
              <UserPlus className="size-4"></UserPlus>
            </Link>
            
            <label className="swap swap-rotate btn btn-sm">
              <input type="checkbox" onChange={() => toggleTheme()} />

              <Sun className="swap-on size-4" />
              <Moon className="swap-off size-4" />
            </label>
          </div>
        )}
      </div>
    </nav>
  );
}
