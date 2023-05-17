import React, { useState, useEffect } from "react";
import { socket } from "../socket";

export function MyForm() {
  const [value, setValue] = useState("");
  const [roomId, setRoomId] = useState("MY_ROOM_ID");
  const [userId, setUserId] = useState("MY_USER_ID");
  const [messages, setMessages] = useState([]);

  const [isLoading, setIsLoading] = useState(false);

  socket.on("user-connected", (userId) => {
    console.log(`user connected: ${userId}`);
  });

  socket.on("user-disconnected", (userId) => {
    console.log(`user-disconnected: ${userId}`);
  });

  useEffect(() => {
    socket.on("messageResponse", (data) => {
      console.log(data);
      setMessages([...messages, data]);
    });
  }, [socket, messages]);

  function onSubmit(event) {
    event.preventDefault();
    setIsLoading(true);

    socket.emit("message", value);
  }

  function joinRoom(event) {
    event.preventDefault();

    socket.emit("join-room", roomId, userId);
  }

  return (
    <form onSubmit={onSubmit}>
      <input value={value} onChange={(e) => setValue(e.target.value)} />
      <input value={roomId} onChange={(e) => setRoomId(e.target.value)} />
      <input value={userId} onChange={(e) => setUserId(e.target.value)} />

      <button onClick={joinRoom}>Join Room</button>

      <button type="submit" disabled={isLoading}>
        Submit
      </button>
      <div>
        {messages.map((m) => {
          return <p>{m}</p>;
        })}
      </div>
    </form>
  );
}
