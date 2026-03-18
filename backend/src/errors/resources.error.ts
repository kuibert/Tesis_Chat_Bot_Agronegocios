import { BaseError } from "./base.error";

export class NotFound extends BaseError {
  constructor(resource = "Recurso") {
    super(`${resource} no encontrado`, 404, "NOT_FOUND");
  }
}

export class Conflict extends BaseError {
  constructor(message = "Conflicto de datos") {
    super(message, 409, "CONFLICT");
  }
}
