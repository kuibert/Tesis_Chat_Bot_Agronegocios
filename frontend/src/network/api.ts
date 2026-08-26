import axios from "axios";
import { sileo } from "sileo";

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return "/api";
  }
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl.endsWith("/api") ? envUrl : `${envUrl.replace(/\/$/, "")}/api`;
  }
  return "http://localhost:3000/api";
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let logoutFn: () => void = () => {};

export const setLogoutHandler = (fn: () => void) => {
  logoutFn = fn;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const response = error.response;

    if (response) {
      const { status, data } = response;

      const mappedError = {
        status,
        code: data?.code || "UNKNOWN_ERROR",
        message: data?.message || "Ocurrió un error inesperado",
      };

      if (response.data.code == "UNAUTHENTICATED") {
        const session = localStorage.getItem("session");

        sileo.error({
          title: "Sesion",
          description:
            "No has iniciado sesión, para acceder a otras funciones necesitas iniciar sesion",
          duration: 4000,
        });

        if (session) logoutFn();
      }

      return Promise.reject(mappedError);
    }

    return Promise.reject({
      status: 0,
      code: "NETWORK_ERROR",
      message: "Error de red o servidor no disponible",
    });
  },
);
