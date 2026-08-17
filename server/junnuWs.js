import { WebSocketServer } from "ws";
import { authenticateStudent } from "./db.js";
import { junnuBindSocket, junnuSignal, junnuUnbindSocket } from "./junnu.js";

export function attachJunnuWs(httpServer) {
  const wss = new WebSocketServer({ server: httpServer, path: "/junnu-ws" });
  wss.on("connection", (socket) => {
    socket.on("message", (raw) => {
      let message;
      try {
        message = JSON.parse(String(raw));
      } catch (_error) {
        return;
      }
      if (message.type === "hello") {
        const actor = authenticateStudent(String(message.identifier || ""), String(message.password || ""));
        if (!actor || !message.roomId || !message.peerId) {
          socket.close();
          return;
        }
        socket.roomId = String(message.roomId);
        socket.peerId = String(message.peerId);
        junnuBindSocket(socket.roomId, socket.peerId, socket);
        socket.send(JSON.stringify({ kind: "ready" }));
        return;
      }
      if (message.type === "signal" && socket.peerId && socket.roomId) {
        try {
          junnuSignal({
            roomId: socket.roomId,
            from: socket.peerId,
            to: message.to || "*",
            type: message.signalType || message.kind,
            data: message.data
          });
        } catch (_error) {
          // Drop malformed live-ink packets.
        }
      }
    });
    socket.on("close", () => {
      junnuUnbindSocket(socket.roomId, socket.peerId);
    });
  });
}
