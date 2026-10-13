import http from "http";
import { Server } from "socket.io";

import { registerChatHandlers } from "../socket/chat.socket.js";

import { socketAuthMiddleware } from "../middleware/socketAuth.middleware.js";

export let io: Server;

const parseAllowedOrigins =
  () => {
    return (
      process.env
        .ALLOWED_ORIGINS ||
      "http://localhost:5173"
      // "https://ca0f-150-129-146-122.ngrok-free.app"
    )
      .split(",")
      .map((origin) =>
        origin.trim()
      )
      .filter(Boolean);
  };

export const initializeSocket = (
  server: http.Server
) => {
  io = new Server(server, {
    cors: {
      origin:
        parseAllowedOrigins(),
      credentials: true,
    },
  });

  // AUTH MIDDLEWARE
  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    console.log(
      "User connected:",
      socket.user?.id
    );

    registerChatHandlers(socket);

    socket.on("disconnect", () => {
      console.log(
        "User disconnected:",
        socket.user?.id
      );
    });
  });

  return io;
};
