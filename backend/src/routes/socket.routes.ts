import { Server, Socket } from "socket.io";

import { registerMessageHandlers } from "../features/messages/message.handler";

export const socketRoutes = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log(`Usuario conectado: ${socket.id}`);
    registerMessageHandlers(io, socket);
    socket.on("disconnect", () => {
      console.log("Usuario desconectado");
    });
  });
};
