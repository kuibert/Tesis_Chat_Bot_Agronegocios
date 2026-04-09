import { Provider, SignInParams } from "@/types/auth.types";
import { googleLogout } from "@react-oauth/google";

import { api } from "../api";

export const signIn = async ({ provider, data }: SignInParams) => {
  if (provider === "local") {
    const name = data.email.split("@")[0];

    await api.post("/auth/login/local", {
      name,
      ...data,
    });
  }

  if (provider === "google" || provider === "microsoft") {
    await api.post("/auth/login/oauth", {
      ...data,
    });
  }

  const { data: response } = await api.get("/auth/profile");
  const session = {
    id: response.id,
    name: response.name,
    email: response.email,
    avatar: response.avatar,
    provider,
  };

  return session;
};

export const signOut = async ({ provider }: { provider: Provider }) => {
  if (provider === "google") googleLogout();

  await api.post("/auth/logout");
};

export const getProfile = async () => {
  const { data: response } = await api.get("/auth/profile");
  return response;
};
