import { io, Socket } from "socket.io-client";

if (!process.env.REACT_APP_API_ENDPOINT) {
  throw new Error("process.env.REACT_APP_API_ENDPOINT is required");
}
const url: string = process.env.REACT_APP_API_ENDPOINT;

interface ClientToServerEvents {
  "join-room": (roomId: string, userId: string) => void;
  "new-offer": (offerObj: {}, userIdTo: string, userIdFrom: string) => void;
  "new-answer": (answerObj: {}, userIdTo: string, userIdFrom: string) => void;
  "new-iceCandidate": (iceCandidate: {}, userId: string) => void;
  "new-answerCandidate": (
    iceCandidate: {},
    userIdTo: string,
    userIdFrom: string
  ) => void;
  "disconnect-user": (userId: string) => void;
}

interface ServerToClientEvents {
  "user-connected": (userId: string) => void;
  "user-disconnected": (userId: string) => void;
  offer: (offerObj: {}, userIdTo: string, userIdFrom: string) => void;
  answer: (answerObj: {}, userIdTo: string, userIdFrom: string) => void;
  offerCandidate: (iceCandidate: {}) => void;
  answerCandidate: (
    iceCandidate: {},
    userIdTo: string,
    userIdFrom: string
  ) => void;
}

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> =
  io(url);
