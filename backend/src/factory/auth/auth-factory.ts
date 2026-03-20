import { AuthHandler } from "./auth-factory.types";
import { LocalHandler } from "./handlers/local-handler";
import { GoogleHandler } from "./handlers/google-handler";
import { MicrosoftHandler } from "./handlers/microsoft-handler";

export type Provider = "google" | "microsoft" | "local";

export class AuthProviderFactory {
  static getHandler(provider: Provider): AuthHandler {
    switch (provider) {
      case "google":
        return new GoogleHandler();
      case "microsoft":
        return new MicrosoftHandler();
      case "local":
        return new LocalHandler();
      default:
        throw new Error(`Proveedor ${provider} no soportado`);
    }
  }
}
