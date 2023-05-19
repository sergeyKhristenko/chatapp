import * as Router from "koa-router";
import { randomBytes } from "crypto";

const router = new Router();

function getRandomString(size) {
  return randomBytes(64).toString("hex").slice(0, size);
}

router.get("/newRoom", (ctx) => {
  const newRoomID = [...new Array(3)].map(() => getRandomString(4)).join('-')

  ctx.body = { roomId: newRoomID };
  ctx.response.type = "application/json";
  ctx.response.status = 200;
});

export default router;
