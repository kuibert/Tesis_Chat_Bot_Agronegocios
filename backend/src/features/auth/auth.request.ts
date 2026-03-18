import { checkSchema } from "express-validator";

export const loginRequest = checkSchema({
  email: {
    in: ["body"],
    notEmpty: { errorMessage: "El email es obligatorio" },
    isEmail: { errorMessage: "Email inválido" },
    normalizeEmail: true,
  },
  provider: {
    in: ["body"],
    notEmpty: {
      errorMessage: "El proveedor de autenticación es obligatorio",
    },
    isIn: {
      options: [["local", "google", "microsoft"]],
      errorMessage: "Proveedor no soportado",
    },
  },
  password: {
    in: ["body"],
    custom: {
      options: (value, { req }) => {
        if (req.body.provider === "local") {
          if (!value) {
            throw new Error("Password es requerido para login local");
          }

          if (value.length < 6) {
            throw new Error("La contraseña debe tener al menos 6 caracteres");
          }
        }
        return true;
      },
    },
  },
  name: {
    in: ["body"],
    optional: true,
    trim: true,
  },
  accessToken: {
    in: ["body"],
    optional: true,
  },
});
