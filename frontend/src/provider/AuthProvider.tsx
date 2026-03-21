import { ReactNode, useEffect, useState } from "react";

import { AuthContext, LocalSession, Session, SignInParams } from "@/context";

interface AuthProviderProps {
  children?: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const hasSession = !!session;

  const handleSignIn = async (params: SignInParams) => {
    if (params.provider === "local") {
    } else {
    }
  };

  const handleRegister = async ({ data }: { data: LocalSession }) => {};

  const handleSignOut = async () => {};

  useEffect(() => {
    const stored = localStorage.getItem("session");
    if (stored) setSession(JSON.parse(stored));
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
