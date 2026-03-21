import { Provider } from "@/types/auth.types";

import { AuthHandler } from "./auth-factory.type";
import { Localhandler } from "./handlers/local-handler";

export class AuthProviderFactory {
  static invoke(provider: Provider): AuthHandler {
    switch (provider) {
      case "local":
        return new Localhandler();
      default:
        throw new Error("Provider no implementado");
    }
  }
}
