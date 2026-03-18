export interface AuthProfile {
  id: string;
  email: string;
  name: string;
  image?: string;
  provider: "google" | "microsoft" | "local";
  accessToken?: string;
}

export interface AuthLocalProfile extends AuthProfile {
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
