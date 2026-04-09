import {
  PanelLeftOpen,
  PanelLeftClose,
  Sun,
  Moon,
  UserPlus,
  Settings,
  LogOut,
  Trash2,
  Share2,
} from "lucide-react";
import { Link } from "react-router";

import { useApp } from "@/hooks/useApp";
import { useAuth } from "@/hooks/useAuth";

type NavProps = React.ComponentProps<"nav">;

interface NavBarProps extends NavProps {}

export function NavBar({ ...props }: NavBarProps) {
  const { isSideOpen, toggleTheme, themeMode } = useApp();
  const { hasSession, session, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

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

        {!hasSession ? (
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
        ) : (
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-sm btn-ghost m-1"
            >
              <Settings className="size-4" />
            </div>

            <ul
              tabIndex={0}
              className="menu dropdown-content bg-base-200 rounded-box z-999 w-56 p-2 shadow-2xl border border-base-300"
            >
              <div className="flex items-center gap-2 px-3 py-2 overflow-hidden">
                <div className="avatar placeholder shrink-0">
                  {session?.avatar ? (
                    <div className="w-6 rounded-full">
                      <img
                        src={session.avatar}
                        alt="avatar"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="bg-neutral text-neutral-content w-6 rounded-full flex items-center justify-center">
                      <span className="text-[10px] uppercase font-bold">
                        {session?.name?.[0] || session?.email?.[0]}
                      </span>
                    </div>
                  )}
                </div>

                <span
                  className="text-sm truncate flex-1 min-w-0"
                  title={session?.email}
                >
                  {session?.email}
                </span>
              </div>

              <li className="menu-title">Configuraciones</li>
              <li>
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2"
                >
                  {themeMode == "dark" ? (
                    <Sun className="swap-on size-4" />
                  ) : (
                    <Moon className="swap-off size-4" />
                  )}
                  <span>{themeMode == "dark" ? "Claro" : "Oscuro"}</span>
                </button>
              </li>
              <li>
                <button className="flex items-center gap-2">
                  <Share2 className="size-4 " />
                  Compartir chat
                </button>
              </li>
              <li>
                <button className="flex items-center gap-2 text-error hover:bg-error/10">
                  <Trash2 className="size-4" />
                  Eliminar chat
                </button>
              </li>

              <div className="divider my-1"></div>
              <li>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 font-semibold"
                >
                  <LogOut className="size-4" />
                  Cerrar sesión
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
}
