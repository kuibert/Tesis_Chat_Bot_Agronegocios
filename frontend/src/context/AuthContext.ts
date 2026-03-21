import { createContext } from "react";

export type Provider = "local" | "google" | "microsoft";
export interface Session {
  name: string;
  email: string;
  avatar?: string;
}

export interface OauthSession {
  idToken: string;
  provider: Provider;
}

export interface LocalSession extends Omit<Session, "name"> {
  name?: string;
  password: string;
}

export type SignInParams =
  | { provider: "local"; data: LocalSession }
  | { provider: "google"; data: OauthSession }
  | { provider: "microsoft"; data: OauthSession };

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
