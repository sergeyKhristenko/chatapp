import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import { Link } from "react-router-dom";

export default function App() {
  const [roomLink, setRoomLink] = useState(null);

  async function getNewRoomId() {
    const req = await fetch("http://localhost:3000/api/newRoom");
    const body = await req.json();
    setRoomLink(body.roomId);
  }

  return (
    <div>
      <header>HEY</header>
      <button onClick={getNewRoomId}>Generate Link To new room</button>
      {roomLink && <Link to={`room/${roomLink}`}>go to new room</Link>}
    </div>
  );
}
