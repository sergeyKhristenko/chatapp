import { useState } from "react";
import "./App.css";
import { Link } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_ENDPOINT;

export default function App() {
  const [roomLink, setRoomLink] = useState(null);

  async function getNewRoomId() {
    const req = await fetch(`${API_URL}/api/newRoom`);
    const body = await req.json();
    setRoomLink(body.roomId);
  }

  return (
    <div>
      <header>HEY</header>
      <button onClick={getNewRoomId}>Generate Link To new room</button>
      {roomLink && <Link to={`/room/${roomLink}`}>go to new room</Link>}
    </div>
  );
}
