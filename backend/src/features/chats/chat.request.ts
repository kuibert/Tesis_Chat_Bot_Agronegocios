import { checkSchema } from "express-validator";

export const postChatRequest = checkSchema({
  title: {
    in: ["body"],
    notEmpty: { errorMessage: "El titulo es obligatorio" },
  },
});

export const getMessagesRequest = checkSchema({
  chatId: {
    in: ["params"],
    notEmpty: {
      errorMessage: "El chatId es obligatorio",
    },
  },
  limit: {
    in: ["query"],
    optional: true,
    isInt: {
      options: { min: 1, max: 100 },
      errorMessage: "El limit debe ser un número entre 1 y 100",
    },
    toInt: true,
  },
  offset: {
    in: ["query"],
    optional: true,
    isInt: {
      options: { min: 0 },
      errorMessage: "El offset debe ser mayor o igual a 0",
    },
    toInt: true,
  },
});
