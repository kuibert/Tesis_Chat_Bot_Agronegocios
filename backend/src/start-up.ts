import * as server from "./server";
import * as ioServer from "./io.server";

export const init = () => {
  ioServer.listen(server.httpServer);
  return Promise.all([server.listen({ port: 3000, host: "localhost" })]);
};
