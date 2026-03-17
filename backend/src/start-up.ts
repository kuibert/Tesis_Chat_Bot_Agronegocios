import * as server from "./server";

export const init = () => {
  return Promise.all([server.listen({ port: 3000, host: "localhost" })]);
};
