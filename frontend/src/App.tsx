import { BrowserRouter } from "react-router";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { MsalProvider } from "@azure/msal-react";
import { msalInstance } from "@/libs/microsoft";

import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import { MainNavigation } from "./navigations";

import { AppProvider, AuthProvider } from "./provider";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const queryClient = new QueryClient();

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AuthProvider>
          <MsalProvider instance={msalInstance}>
            <GoogleOAuthProvider clientId={CLIENT_ID}>
              <QueryClientProvider client={queryClient}>
                <MainNavigation />
              </QueryClientProvider>
            </GoogleOAuthProvider>
          </MsalProvider>
        </AuthProvider>
      </AppProvider>
    </BrowserRouter>
  );
}
