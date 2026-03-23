import { BrowserRouter } from "react-router";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { MsalProvider } from "@azure/msal-react";
import { msalInstance } from "@/libs/microsoft";

import { MainNavigation } from "./navigations";

import { AppProvider, AuthProvider } from "./provider";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AuthProvider>
          <MsalProvider instance={msalInstance}>
            <GoogleOAuthProvider clientId={CLIENT_ID}>
              <MainNavigation />
            </GoogleOAuthProvider>
          </MsalProvider>
        </AuthProvider>
      </AppProvider>
    </BrowserRouter>
  );
}
