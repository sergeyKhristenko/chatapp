import {
  Application,
  Router,
  Status,
  crypto,
  ServerSentEvent,
  ServerSentEventTarget,
} from "./deps.ts";

const sockets: { [roomID: string]: ServerSentEventTarget[] } = {};

const router = new Router();
router.get("/", (ctx) => {
  ctx.response.status = Status.OK;
  // ctx.response.body = `<!DOCTYPE html>
  //   <html>
  //     <head><title>Hello oak!</title><head>
  //     <body>
  //       <a href='/newRoom'>Create new room <a/>
  //     </body>
  //   </html>
  // `;
});

router.get("/newRoom", (ctx) => {
  const newRoomID = crypto.randomUUID();
  sockets[newRoomID] = [];

  ctx.response.body = { roomId: newRoomID };
  ctx.response.type = "application/json";
  ctx.response.status = Status.OK;
});

router.post("/room/:ROOMID", async (ctx) => {
  const roomID = ctx.params.ROOMID;
  const userID = await ctx.request.body().value;

  sockets[roomID].forEach((socket) => {
    const event = new ServerSentEvent("user-connected", {
      data: { userID },
    });
    socket.dispatchEvent(event);
  });

  ctx.response.status = Status.Accepted;
});

router.get("/sse/:ROOMID", (ctx) => {
  const roomID = ctx.params.ROOMID;
  const target = ctx.sendEvents();

  sockets[roomID].push(target);
});

router.get("/room/:ROOMID", (ctx) => {
  ctx.response.body = `<!DOCTYPE html>
  <html>
    <body>
      <h1>New room will be here</h1>
      <p>UUID: ${ctx.params.ROOMID}</p>

    </body>
    <script>
      const source = new EventSource("/sse/${ctx.params.ROOMID}");
      source.addEventListener("user-connected", (evt) => {
        const connectedUser = document.createElement('p')
        connectedUser.textContent = 'user connected: ' + evt.data;
        document.body.appendChild(connectedUser)
      });

      const myPeerId = self.crypto.randomUUID()

      const peerIdTextNode = document.createTextNode('My PeerJS ID: ' + myPeerId);
      document.body.appendChild(peerIdTextNode)

      fetch('http://localhost:3000/room/${ctx.params.ROOMID}', {
        method: 'POST',
        body: JSON.stringify(myPeerId),
      })
    </script>
  </html>
`;
});

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

app.listen({ port: 3000 });
