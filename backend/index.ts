import * as Koa from "koa";
import * as Router from "koa-router";

import * as logger from "koa-logger";
import * as json from "koa-json";

import { createServer } from "http";
import { Server } from "socket.io";

const app = new Koa();
const router = new Router();

router.get("/", async (ctx, next) => {
  ctx.body = "Welcome to Cheap Talk!";
  await next();
});

router.get("/api/newRoom", (ctx) => {
  const newRoomID = crypto.randomUUID();

  ctx.body = { roomId: newRoomID };
  ctx.response.type = "application/json";
  ctx.response.status = 200;
});

app.use(json());
app.use(logger());

app.use(router.routes()).use(router.allowedMethods());

const httpServer = createServer(app.callback());

const io = new Server(httpServer, {
  // for localhost
  // cors: {
  //   origin: "http://localhost:3001",
  //   methods: ["GET", "POST"],
  //   credentials: true,
  // },
  // allowEIO3: true,
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.broadcast.to(roomId).emit("user-connected", userId);

    socket.on("new-offer", () => {
      socket.broadcast.to(roomId).emit("offer", userId);
    });

    socket.on("new-answer", () => {
      socket.broadcast.to(roomId).emit("answer", userId);
    });

    socket.on("new-offerCandidate", () => {
      socket.broadcast.to(roomId).emit("offerCandidate", userId);
    });

    socket.on("new-answerCandidate", () => {
      socket.broadcast.to(roomId).emit("answerCandidate", userId);
    });

    socket.on("disconnect", () => {
      socket.broadcast.to(roomId).emit("user-disconnected", userId);
    });
  });
});

httpServer.listen(3000);
