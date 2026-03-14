import { Route, Routes } from "react-router";

import { ChatPage } from "@/page";
import { DashboardLayout } from "@/layouts";

export function MainNavigation() {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<ChatPage />}></Route>
      </Route>
    </Routes>
  );
}
