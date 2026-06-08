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

      <div className="drawer-content bg-[#131517] text-gray-100 min-h-screen flex flex-col">
        <NavBar className="navbar w-full bg-[#131517] border-b border-[#2D3139]" />

        <main className="flex flex-1 w-full h-full overflow-hidden">
          <Outlet />
        </main>
      </div>

      <SideBar className="drawer-side is-drawer-close:overflow-visible" />
    </div>
  );
}
