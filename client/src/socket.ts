import { io, Socket } from "socket.io-client";

interface ClientToServerEvents {
  "join-room": (roomId: string) => void;
  "new-offer": (offerObj: {}) => void;
  "new-answer": (answerObj: {}) => void;
  "new-iceCandidate": (iceCandidate: {}) => void;
  "new-answerCandidate": (iceCandidate: {}) => void;
}

interface ServerToClientEvents {
  "user-connected": () => void;
  "user-disconnected": () => void;
  offer: (offerObj: {}) => void;
  answer: (answerObj: {}) => void;
  offerCandidate: (iceCandidate: {}) => void;
  answerCandidate: (iceCandidate: {}) => void;
}

const url = "http://localhost:3000";
// const url = "https://chat.cheapcode.live";

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  url,
  { forceNew: true }
);
