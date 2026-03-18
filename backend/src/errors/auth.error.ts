import { BaseError } from "./base.error";

export class Unauthorized extends BaseError {
  constructor(message = "No autenticado") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class Forbidden extends BaseError {
  constructor(message = "No tienes permisos") {
    super(message, 403, "FORBIDDEN");
  }
}

export class InvalidCredentials extends BaseError {
  constructor(message = "Credenciales inválidas") {
    super(message, 401, "INVALID_CREDENTIALS");
  }
}

export class TokenExpired extends BaseError {
  constructor(message = "Token expirado") {
    super(message, 401, "TOKEN_EXPIRED");
  }
}
