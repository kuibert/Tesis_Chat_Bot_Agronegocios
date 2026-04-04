import { Server, Socket } from "socket.io";
import * as messageService from "./message.service";

export const registerMessageHandlers = (io: Server, socket: Socket) => {
  socket.on("messages:send", async (payload) => {
    try {
      const { chatId, content } = payload;

      await messageService.saveMessage(
        { chatId, content }, 
        (message) => { 
          socket.emit("messages:created", message); 
        }, 
        (chunk, messageId) => { 
          socket.emit("messages:stream", {chunk, messageId}); 
        }
      );

    } catch (error) {
      console.error("Error en el flujo de mensajes:", error);
      socket.emit("messages:error", "Error al procesar el mensaje");
    } finally {
      socket.emit("messages:end");
    }
  });
};