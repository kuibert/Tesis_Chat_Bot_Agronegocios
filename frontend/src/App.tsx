import { BrowserRouter } from "react-router";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { MsalProvider } from "@azure/msal-react";
import {
  QueryClient,
  QueryClientProvider
} from "@tanstack/react-query";

import { msalInstance } from "@/libs/microsoft";

import { MainNavigation } from "./navigations";

import { AppProvider, AuthProvider } from "./provider";

const queryClient = new QueryClient();

export default function App() {
  const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <BrowserRouter>
      <AppProvider>
        <MsalProvider instance={msalInstance}>
          <GoogleOAuthProvider clientId={CLIENT_ID}>
            <QueryClientProvider client={queryClient}>
              <AuthProvider>
                <MainNavigation />
              </AuthProvider>
            </QueryClientProvider>
          </GoogleOAuthProvider>
        </MsalProvider>
      </AppProvider>
    </BrowserRouter>
  );
}
