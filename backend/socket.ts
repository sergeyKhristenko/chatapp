import { Server } from "socket.io";

const devOptions = {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
  allowEIO3: true,
};
const isDev = process.env.NODE_ENV !== "production";

function setupSocketIO(httpServer) {
  const io = new Server(httpServer, isDev ? devOptions : {});

  io.on("connection", (socket) => {
    socket.on("join-room", (roomId, userId) => {
      socket.join(roomId);
      socket.broadcast.to(roomId).emit("user-connected", userId);

      socket.on("new-offer", (offerObj, userIdTo, userIdFrom) => {
        socket.broadcast
          .to(roomId)
          .emit("offer", offerObj, userIdTo, userIdFrom);
      });

      socket.on("new-answer", (answerObj, userIdTo, userIdFrom) => {
        socket.broadcast
          .to(roomId)
          .emit("answer", answerObj, userIdTo, userIdFrom);
      });

      socket.on("new-offerCandidate", (iceCandidate, userIdTo, userIdFrom) => {
        socket.broadcast
          .to(roomId)
          .emit("offerCandidate", iceCandidate, userIdTo, userIdFrom);
      });

      socket.on("new-answerCandidate", (iceCandidate, userIdTo, userIdFrom) => {
        socket.broadcast
          .to(roomId)
          .emit("answerCandidate", iceCandidate, userIdTo, userIdFrom);
      });

      socket.on("disconnect", () => {
        socket.broadcast.to(roomId).emit("user-disconnected", userId);
      });
    });
  });
}

export default setupSocketIO;
