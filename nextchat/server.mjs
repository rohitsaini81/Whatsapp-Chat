import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = Number.parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(httpServer, {
    maxHttpBufferSize: 1e8,
  });

  io.on("connection", (socket) => {
    socket.on("chat-message", (msg) => {
      if (!msg || typeof msg !== "object") return;

      const safeMessage = {
        name: typeof msg.name === "string" ? msg.name : "user",
        message: typeof msg.message === "string" ? msg.message : "",
        fileData: typeof msg.fileData === "string" ? msg.fileData : null,
        fileName: typeof msg.fileName === "string" ? msg.fileName : null,
      };

      socket.broadcast.emit("chat", safeMessage);
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, hostname, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
