import { BrowserRouter } from "react-router";
import { GoogleOAuthProvider } from "@react-oauth/google";

import { MainNavigation } from "./navigations";

import { AppProvider, AuthProvider } from "./provider";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AuthProvider>
          <GoogleOAuthProvider clientId={CLIENT_ID}>
            <MainNavigation />
          </GoogleOAuthProvider>
        </AuthProvider>
      </AppProvider>
    </BrowserRouter>
  );
}
