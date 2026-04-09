import { BaseError } from "./base.error";

export class ExternalServiceError extends BaseError {
  constructor(service = "Servicio externo") {
    super(`${service} no disponible`, 503, "EXTERNAL_SERVICE_ERROR");
  }
}