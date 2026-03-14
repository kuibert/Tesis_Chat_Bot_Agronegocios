import { useState } from "react";
import { Outlet } from "react-router";

import { NavBar, SideBar } from "@/components";

export function DashboardLayout() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDrawer = () => setIsOpen(!isOpen);

  return (
    <div className="drawer lg:drawer-open">
      <input
        id="my-drawer-4"
        type="checkbox"
        className="drawer-toggle"
        checked={isOpen}
        onChange={toggleDrawer}
      />

      <div className="drawer-content">
        <NavBar isOpen={isOpen} className="navbar w-full bg-base-300" />

        <main className="flex  w-full h-full">
          <Outlet />
        </main>
      </div>

      <SideBar className="drawer-side is-drawer-close:overflow-visible" />
    </div>
  );
}
