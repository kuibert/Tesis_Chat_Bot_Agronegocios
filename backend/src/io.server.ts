import { Server as HttpServer } from "http";
import {
  DefaultEventsMap,
  ExtendedError,
  Server,
  ServerOptions,
  Socket,
} from "socket.io";

import * as cookie from "cookie";

import { socketRoutes } from "./routes/socket.routes";

let io: Server;

type SocketEventRequest = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  any
>;
type SocketNextFunction = (err?: ExtendedError) => void;

const cookiesParsedMiddleware = (
  socket: SocketEventRequest,
  next: SocketNextFunction,
) => {
  const rawCookies = socket.handshake.headers.cookie;

  if (!rawCookies) {
    return next();
  }

  const parsedCookies = cookie.parse(rawCookies);
  const session = parsedCookies[process.env.COOKIE_NAME!];

  socket.data.session = session;
  next();
};

export const listen = (
  httpServer: HttpServer,
  opts?: Partial<ServerOptions>,
): void => {
  io = new Server(httpServer, {
    cors: {
      origin: true,
      methods: ["GET", "POST"],
      credentials: true,
    },
    ...opts,
  });

  io.use(cookiesParsedMiddleware);

  socketRoutes(io);
};
