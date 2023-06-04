import { createServer } from "http";
import * as Koa from "koa";
import * as Router from "koa-router";
import * as logger from "koa-logger";
import * as json from "koa-json";

import socket from "./socket";
import apiRouter from './api';

const app = new Koa();
const router = new Router();
router.use('/api', apiRouter.routes(), apiRouter.allowedMethods())

app.use(json());
app.use(logger());
app.use(router.routes()).use(router.allowedMethods());

const httpServer = createServer(app.callback());
socket(httpServer);

httpServer.listen(3000);
