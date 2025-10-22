// backend/src/routes/notify.js
import { Server } from "socket.io";

let io;

export function init(server) {
  io = new Server(server, { cors: { origin: "*" } });
  io.on("connection", (socket) => {
    console.log("Client connected", socket.id);
    socket.on("join", (userId) => {
      socket.join(`user:${userId}`);
    });
  });
}

export default {
  user(userId, payload) {
    if (io) {
      io.to(`user:${userId}`).emit("notification", payload);
    }
  },
};
