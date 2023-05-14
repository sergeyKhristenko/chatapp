import { Server } from "socket.io";

const devOptions = {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"],
    credentials: true,
  },
  allowEIO3: true,
};
const isDev = process.env.NODE_ENV !== 'production';

function setupSocketIO(httpServer) {
  const io = new Server(httpServer, isDev ? devOptions : {});

  io.on("connection", (socket) => {
    socket.on("join-room", (roomId, userId) => {
      socket.join(roomId);
      socket.broadcast.to(roomId).emit("user-connected", userId);

      socket.on("new-offer", (offerObj) => {
        socket.broadcast.to(roomId).emit("offer", offerObj);
      });

      socket.on("new-answer", (answerObj) => {
        socket.broadcast.to(roomId).emit("answer", answerObj);
      });

      socket.on("new-offerCandidate", (iceCandidate) => {
        socket.broadcast.to(roomId).emit("offerCandidate", iceCandidate);
      });

      socket.on("new-answerCandidate", (iceCandidate) => {
        socket.broadcast.to(roomId).emit("answerCandidate", iceCandidate);
      });

      socket.on("disconnect", () => {
        socket.broadcast.to(roomId).emit("user-disconnected", userId);
      });
    });
  });
}

export default setupSocketIO;
