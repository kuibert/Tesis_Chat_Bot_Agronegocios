import { Route, Routes } from "react-router";

import { ChatPage, SignInPage } from "@/page";
import { DashboardLayout } from "@/layouts"; 

export function MainNavigation() {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<ChatPage />}></Route>
      </Route>
      <Route path="sign-in" element={<SignInPage />}></Route>
    </Routes>
  );
}
