import { OAuthHandler } from "./handlers/oauth-handler";
import { AuthHandler } from "./auth-factory.types";
import { LocalHandler } from "./handlers/local-handler";

export type Provider = "google" | "microsoft" | "local";

export class AuthProviderFactory {
  static getHandler(provider: Provider): AuthHandler {
    switch (provider) {
      case "google":
      case "microsoft":
        return new OAuthHandler();
      case "local":
        return new LocalHandler();
      default:
        throw new Error(`Proveedor ${provider} no soportado`);
    }
  }
}
