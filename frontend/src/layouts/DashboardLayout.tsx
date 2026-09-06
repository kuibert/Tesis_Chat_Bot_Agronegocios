import { Outlet } from "react-router";

import { NavBar, SideBar } from "@/components";
import { useApp } from "@/hooks/useApp";

export function DashboardLayout() {
  const { isSideOpen, toggleSide } = useApp();

  const toggleDrawer = () => toggleSide();

  return (
    <div className={`drawer ${isSideOpen ? "lg:drawer-open" : ""}`}>
      <input
        id="my-drawer-4"
        type="checkbox"
        className="drawer-toggle"
        checked={isSideOpen}
        onChange={toggleDrawer}
      />

      <div className="drawer-content bg-slate-50 dark:bg-[#131517] text-slate-800 dark:text-gray-100 h-dvh flex flex-col overflow-hidden transition-colors duration-200">
        <NavBar className="navbar w-full bg-white dark:bg-[#131517] border-b border-slate-200 dark:border-[#2D3139] shadow-sm dark:shadow-none" />

        <main className="flex flex-1 w-full overflow-hidden">
          <Outlet />
        </main>
      </div>

      <SideBar className="drawer-side is-drawer-close:overflow-visible" />
    </div>
  );
}
