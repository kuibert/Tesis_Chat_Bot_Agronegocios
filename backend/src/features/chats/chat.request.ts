import { checkSchema } from "express-validator";

export const postChatRequest = checkSchema({
  title: {
    in: ["body"],
    notEmpty: { errorMessage: "El titulo es obligatorio" },
  },
});
