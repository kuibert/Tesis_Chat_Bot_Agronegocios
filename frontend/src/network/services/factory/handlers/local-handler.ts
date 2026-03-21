import { LocalSession, Session } from "@/types/auth.types";
import { AuthHandler } from "../auth-factory.type";

import { api } from "@/network/api";

export class Localhandler implements AuthHandler {
  async handler({ profile }: { profile: LocalSession }): Promise<Session> {
    let session: Session;
    const name = profile.email.split("@")[0];

    await api.post("/auth/login/local", {
      name,
      ...profile,
    });

    const { data } = await api.get("/auth/profile");
    session = {
      id: data.id,
      name: data.name,
      email: data.email,
      avatar: data.avatar,
    };

    return session;
  }
}
