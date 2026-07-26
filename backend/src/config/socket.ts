import { Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import { env } from "./env.js";

let io: SocketServer | null = null;

export const initSocket = (server: HttpServer) => {
  io = new SocketServer(server, {
    cors: {
      origin: "*", // Adjust for production
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  console.log("🔌 WebSocket server initialized");
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
