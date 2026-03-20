import { AuthProviderFactory, Provider } from "../../factory/auth/auth-factory";
import { AuthProfile } from "../../factory/auth/auth-factory.types";

export const authenticate = async (provider: Provider, data: AuthProfile) => {
  const handler = AuthProviderFactory.getHandler(provider);
  const session = await handler.handle(data);
 
  return { session };
};
