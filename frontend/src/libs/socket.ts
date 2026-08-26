import { io } from "socket.io-client";

const getSocketUrl = () => {
  if (typeof window !== "undefined") {
    return "/";
  }
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl.endsWith("/api") ? envUrl.slice(0, -4) : envUrl.replace(/\/$/, "");
  }
  return "http://localhost:3000";
};

export const socket = io(getSocketUrl(), {
  autoConnect: false,
  withCredentials: true,
});
