export type Provider = "local" | "google" | "microsoft";
export interface Session {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider?: Provider;
}

export interface OauthSession {
  idToken: string;
  provider: Provider;
}

export interface LocalSession extends Omit<Session, "name" | "id"> {
  password: string;
}

export type SignInParams =
  | { provider: "local"; data: LocalSession }
  | { provider: "google"; data: OauthSession }
  | { provider: "microsoft"; data: OauthSession };
