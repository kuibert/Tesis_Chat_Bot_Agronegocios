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

    let result: { messageId?: string; metadata?: Record<string, unknown> } = {};

    try {
      if (chatId === 'no-memory-session') {
        // Sesión temporal sin memoria: no tocar PostgreSQL
        console.log('🛑 [DB Bypass] Sesión sin memoria detectada. No se guardará el mensaje en PostgreSQL.');
        result = await messageService.noMemoryMessage({ content }, onCreate, onStream, abortController.signal);
      } else if (hasSession) {
        result = await messageService.saveMessage(
          { chatId, content },
          onCreate,
          onStream,
          abortController.signal
        );
      } else {
        result = await messageService.noMemoryMessage({ content }, onCreate, onStream, abortController.signal);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("Error en el flujo de mensajes:", error);
        socket.emit("messages:error", "Error al procesar el mensaje");
      }
    } finally {
      controllers.delete(chatId);
      // LOG TEMPORAL
      console.log("[handler] result antes de messages:end:", JSON.stringify(result));
      socket.emit("messages:end", {
        messageId: result.messageId,
        metadata: result.metadata ?? null,
      });
    }
  });

  socket.on("messages:calculate", async (payload) => {
    const { chatId, content, toolParams } = payload;

    const abortController = new AbortController();
    controllers.set(chatId, abortController);

    let result: { messageId?: string; metadata?: Record<string, unknown> } = {};

    try {
      result = await messageService.calculateDirect(
        { chatId, content, toolParams },
        onCreate,
        onStream,
        abortController.signal,
      );
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Error en cálculo directo:", error);
        socket.emit("messages:error", "Error al procesar el cálculo");
      }
    } finally {
      controllers.delete(chatId);
      console.log("[handler calculate] result antes de messages:end:", JSON.stringify(result));
      socket.emit("messages:end", {
        messageId: result.messageId,
        metadata: result.metadata ?? null,
      });
    }
  });
};
