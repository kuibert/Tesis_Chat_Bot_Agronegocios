import { LocalSession, OauthSession, Session } from "@/types/auth.types";

export interface AuthHandler {
  handler ({
    profile,
  }: {
    profile: LocalSession | OauthSession;
  }): Promise<Session>;
}
