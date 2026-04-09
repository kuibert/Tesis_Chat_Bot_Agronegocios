import { BaseError } from "./base.error";

export class BadRequest extends BaseError {
  constructor(message = "Solicitud inválida") {
    super(message, 400, "BAD_REQUEST");
  }
}

export class Validation extends BaseError {
  constructor(errors: Record<string, string[]>) {
    super("The given data was invalid.", 422, "VALIDATION_ERROR", errors);
  }
}
