import { BrowserRouter } from "react-router";
import { MainNavigation } from "./navigations";

import { AppProvider, AuthProvider } from "./provider";

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AuthProvider>
          <MainNavigation />
        </AuthProvider>
      </AppProvider>
    </BrowserRouter>
  );
}
