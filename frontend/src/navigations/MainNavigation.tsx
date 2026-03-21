import { Route, Routes } from "react-router";

import { ChatPage, SignInPage } from "@/page";
import { DashboardLayout } from "@/layouts";
import { RegisterPartail, SignInPartial } from "@/page/partials";

export function MainNavigation() {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<ChatPage />}></Route>
      </Route>
      <Route path="sign-in" element={<SignInPage />}>
        <Route index element={<SignInPartial />} />
        <Route path="register" element={<RegisterPartail />} />
      </Route>
    </Routes>
  );
}
