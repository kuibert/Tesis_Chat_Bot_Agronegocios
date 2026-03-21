import { SignInParams } from "@/types/auth.types";
import { AuthProviderFactory } from "./factory/auth-factory";

import { api } from "../api";

export const authenticate = async ({ provider, data }: SignInParams) => {
  const authProvider = AuthProviderFactory.invoke(provider);

  const session = await authProvider.handler({
    profile: {
      ...data,
    },
  });

  return session;
};

export const signOut = async () => {
  await api.post("/auth/logout");
};
