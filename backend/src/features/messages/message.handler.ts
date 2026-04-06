import { Server, Socket } from "socket.io";
import * as messageService from "./message.service";

export const registerMessageHandlers = (io: Server, socket: Socket) => {
  const onCreate = (message: any) => socket.emit("messages:created", message);
  const onStream = (chunk: string, messageId: string) =>
    socket.emit("messages:stream", { chunk, messageId });

  socket.on("messages:send", async (payload) => {
    const hasSession = !!socket.data.session;

    try {
      const { chatId, content } = payload;

      if (hasSession) {
        await messageService.saveMessage(
          { chatId, content },
          onCreate,
          onStream,
        );
      } else {

        console.log("entro")

        await messageService.noMemoryMessage({ content }, onCreate, onStream);
      }
    } catch (error) {
      console.error("Error en el flujo de mensajes:", error);
      socket.emit("messages:error", "Error al procesar el mensaje");
    } finally {
      socket.emit("messages:end");
    }
  });
};
