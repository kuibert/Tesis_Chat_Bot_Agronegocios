import { checkSchema } from "express-validator";

export const loginLocalRequest = checkSchema({
  name: {
    in: ["body"],
    notEmpty: { errorMessage: "El nombre es obligatorio" },
    trim: true,
  },

  email: {
    in: ["body"],
    notEmpty: { errorMessage: "El email es obligatorio" },
    isEmail: { errorMessage: "Email inválido" },
    normalizeEmail: true,
  },

  password: {
    in: ["body"],
    notEmpty: { errorMessage: "La contraseña es obligatoria" },
    isLength: {
      options: { min: 6 },
      errorMessage: "La contraseña debe tener al menos 6 caracteres",
    },
  },
});

export const loginOAuthRequest = checkSchema({
  provider: {
    in: ["body"],
    notEmpty: {
      errorMessage: "El proveedor es obligatorio",
    },
    isIn: {
      options: [["google", "microsoft"]],
      errorMessage: "Proveedor no soportado",
    },
  },

  idToken: {
    in: ["body"],
    notEmpty: {
      errorMessage: "idToken es requerido",
    },
  },
});
 