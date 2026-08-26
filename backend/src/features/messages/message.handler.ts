import { Server, Socket } from "socket.io";
import * as messageService from "./message.service";

// Mapa global para guardar los AbortControllers por chatId
const controllers = new Map<string, AbortController>();

export const registerMessageHandlers = (io: Server, socket: Socket) => {
  const onCreate = (message: any) => socket.emit("messages:created", message);
  const onStream = (chunk: string, messageId: string) =>
    socket.emit("messages:stream", { chunk, messageId });

  socket.on("messages:stop", (chatId: string) => {
      const controller = controllers.get(chatId);
      if (controller) {
          controller.abort();
          controllers.delete(chatId);
      }
  });

  socket.on("messages:send", async (payload) => {
    const hasSession = !!socket.data.session;
    const { chatId, content } = payload;
    
    // Crear un nuevo AbortController para este request
    const abortController = new AbortController();
    controllers.set(chatId, abortController);

    try {
      if (chatId === 'no-memory-session') {
        // Sesión temporal sin memoria: no tocar PostgreSQL
        console.log('🛑 [DB Bypass] Sesión sin memoria detectada. No se guardará el mensaje en PostgreSQL.');
        await messageService.noMemoryMessage({ content }, onCreate, onStream, abortController.signal);
      } else if (hasSession) {
        await messageService.saveMessage(
          { chatId, content },
          onCreate,
          onStream,
          abortController.signal
        );
      } else {
        await messageService.noMemoryMessage({ content }, onCreate, onStream, abortController.signal);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
          console.error("Error en el flujo de mensajes:", error);
          socket.emit("messages:error", "Error al procesar el mensaje");
      }
    } finally {
      controllers.delete(chatId);
      socket.emit("messages:end");
    }
  });
};
