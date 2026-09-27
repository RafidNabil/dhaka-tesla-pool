import { Server } from "socket.io";

let io;

export const initializeWebSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`WebSocket connected: ${socket.id}`);

    socket.on("joinUserRoom", (userId) => {
      socket.join(`user:${userId}`);
    });

    socket.on("joinPoolRoom", (poolId) => {
      socket.join(`pool:${poolId}`);
    });

    socket.on("leavePoolRoom", (poolId) => {
      socket.leave(`pool:${poolId}`);
    });

    socket.on("disconnect", () => {
      console.log(`WebSocket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("WebSocket server has not been initialized");
  }

  return io;
};

export const emitToUser = (userId, event, data) => {
  getIO().to(`user:${userId}`).emit(event, data);
};

export const emitToPool = (poolId, event, data) => {
  getIO().to(`pool:${poolId}`).emit(event, data);
};
