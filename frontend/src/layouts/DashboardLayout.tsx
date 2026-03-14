import { Outlet } from "react-router";

import { NavBar, SideBar } from "@/components";
import { useApp } from "@/hooks/useApp";

export function DashboardLayout() {
  const { isSideOpen, toggleSide } = useApp();

  const toggleDrawer = () => toggleSide();

  return (
    <div className="drawer lg:drawer-open">
      <input
        id="my-drawer-4"
        type="checkbox"
        className="drawer-toggle"
        checked={isSideOpen}
        onChange={toggleDrawer}
      />

      <div className="drawer-content">
        <NavBar className="navbar w-full bg-base-300" />

        <main className="flex  w-full h-full">
          <Outlet />
        </main>
      </div>

      <SideBar className="drawer-side is-drawer-close:overflow-visible" />
    </div>
  );
}
