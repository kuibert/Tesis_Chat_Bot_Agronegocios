import { AuthProviderFactory, Provider } from "../../factory/auth/auth-factory";

export const authenticate = async (provider: Provider, data: any) => {
  const handler = AuthProviderFactory.getHandler(provider);
  const session = await handler.handle(data);

  // Aquí podrías generar el JWT una vez que el handler valide al usuario
  // const token = generateToken(userId);
  return { session };
};
