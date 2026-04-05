import { ReactNode, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { AuthContext } from "@/context";
import { LocalSession, Session, SignInParams } from "@/types/auth.types";

import * as authService from "@/network/services/auth.service";
import { setLogoutHandler } from "@/network/api";
import { useNavigate } from "react-router";

interface AuthProviderProps {
  children?: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const hasSession = !!session;

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleSignIn = async (params: SignInParams) => {
    const session = await authService.signIn(params);
    setSession(session);
  };

  const handleRegister = async ({ data }: { data: LocalSession }) => {};

  const handleSignOut = async () => {
    await authService.signOut({ provider: session?.provider! });
    setSession(null);
    queryClient.clear();
    navigate("/");
  };

  const forceLogout = () => {
    setSession(null);
    localStorage.removeItem("session");
    queryClient.clear();
    navigate("/");
  };

  useEffect(() => {
    setLogoutHandler(forceLogout);

    const checkAuth = async () => {
      const stored = localStorage.getItem("session");
      if (stored) {
        try {
          const session = await authService.getProfile();
          setSession(session);
        } catch (err) {
          forceLogout();
        }
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (session) {
      localStorage.setItem("session", JSON.stringify(session));
    } else {
      localStorage.removeItem("session");
    }
  }, [session]);

  return (
    <AuthContext.Provider
      value={{
        session,
        signIn: handleSignIn,
        register: handleRegister,
        signOut: handleSignOut,
        hasSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
