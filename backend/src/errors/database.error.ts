import { BaseError } from "./base.error";

export class Database extends BaseError {
  constructor(message = "Error de base de datos") {
    super(message, 500, "DATABASE_ERROR");
  }
}

export class UniqueConstraint extends BaseError {
  constructor(field = "campo") {
    super(`${field} ya está en uso`, 409, "UNIQUE_CONSTRAINT");
  }
}
