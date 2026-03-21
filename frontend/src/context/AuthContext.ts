import { LocalSession, Session, SignInParams } from "@/types/auth.types";
import { createContext } from "react";

export interface AuthContexType {
  session?: Session | null;
  register: ({ data }: { data: LocalSession }) => Promise<void>;
  signIn: (params: SignInParams) => Promise<void>;
  signOut: () => Promise<void>;
  hasSession: boolean;
}

export const AuthContext = createContext<AuthContexType>({
  session: null,
  register: () => Promise.resolve(),
  signIn: () => Promise.resolve(),
  signOut: () => Promise.resolve(),
  hasSession: false,
});
