import { Server, Socket } from "socket.io";

export const socketRoutes = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log(`Usuario conectado: ${socket.id}`);

    // reigster socket routes

    socket.on("disconnect", () => {
      console.log("Usuario desconectado");
    });
  });
};
