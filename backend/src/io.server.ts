import { Server as HttpServer } from "http";
import { Server, ServerOptions } from "socket.io";

import { socketRoutes } from "./routes/socket.routes";

let io: Server;

export const listen = (
  httpServer: HttpServer,
  opts?: Partial<ServerOptions>,
): void => {
  io = new Server(httpServer, {
   cors: { 
      origin: "http://localhost:5173", 
      methods: ["GET", "POST"],
      credentials: true 
    },
    ...opts,
  });

  socketRoutes(io);
};
