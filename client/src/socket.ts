import { io, Socket } from "socket.io-client";

interface ClientToServerEvents {
  "join-room": (roomId: string, userId: string) => void;
  "new-offer": (offerObj: {}, userIdTo: string, userIdFrom: string) => void;
  "new-answer": (answerObj: {}, userIdTo: string, userIdFrom: string) => void;
  "new-iceCandidate": (iceCandidate: {}, userId: string) => void;
  "new-answerCandidate": (iceCandidate: {}, userIdTo: string, userIdFrom: string) => void;
}

interface ServerToClientEvents {
  "user-connected": (userId: string) => void;
  "user-disconnected": () => void;
  offer: (offerObj: {}, userIdTo: string, userIdFrom: string) => void;
  answer: (answerObj: {}, userIdTo: string, userIdFrom: string) => void;
  offerCandidate: (iceCandidate: {}) => void;
  answerCandidate: (iceCandidate: {}, userIdTo: string, userIdFrom: string) => void;
}

const url = "http://localhost:3000";
// const url = "https://chat.cheapcode.live";

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  url,
  { forceNew: true }
);
