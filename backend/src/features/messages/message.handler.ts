import { Server, Socket } from "socket.io";
import * as messageService from "./message.service";

export const registerMessageHandlers = (io: Server, socket: Socket) => {
  socket.on("messages:send", async (payload) => {
    try {
      socket.emit("messages:start");

      const { chatId, content } = payload;

      await messageService.saveMessage({ chatId, content }, (message) => {
        socket.emit("messages:stream", { ...message });
      });
    } catch (error) {
      console.error("Error en el stream de IA:", error);
      socket.emit(
        "messages:error",
        "No se pudo conectar con el servicio de IA",
      );
    } finally {
      socket.emit("messages:end");
    }
  });
};
