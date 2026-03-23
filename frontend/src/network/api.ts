import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

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

      if (status === 401) {
        console.warn("No autorizado");
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
