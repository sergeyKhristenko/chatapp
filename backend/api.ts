import * as Router from "koa-router";
import { randomUUID } from "crypto";

const router = new Router();

router.get("/newRoom", (ctx) => {
  const newRoomID = randomUUID();

  ctx.body = { roomId: newRoomID };
  ctx.response.type = "application/json";
  ctx.response.status = 200;
});

export default router;
