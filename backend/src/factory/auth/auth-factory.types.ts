export interface AuthProfile {
  provider: "google" | "microsoft" | "local";
  idToken?: string;
  id?: string;
  email?: string;
  name?: string;
  image?: string;
  accessToken?: string;
  [key: string]: any;
}

export interface AuthLocalProfile extends AuthProfile {
  image?: string,
  email: string;
  name: string;
  password: string;
}

export interface Session {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  accessToken?: string | null;
}

export interface AuthHandler {
  handle(profile: AuthProfile): Promise<Session>;
}
