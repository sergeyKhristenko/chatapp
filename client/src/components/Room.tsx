import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import MdPhone from "@mui/icons-material/Phone";
import { Button, ButtonGroup } from "@mui/material";
import MicOffIcon from "@mui/icons-material/MicOff";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import { alpha } from "@mui/material";
import { Rnd } from "react-rnd";
import { useNavigate } from "react-router-dom";

import "./Room.css";

import { MediaConnection, Peer } from "peerjs";

import { socket } from "../socket";
import { Mic, NoPhotography } from "@mui/icons-material";

const peerJsLocalConfig = {
  host: "/",
  port: 3001,
};

const peerJsConfig = {
  host: "/",
  path: "peer",
};

export default function Room() {
  const [myPeer, setMyPeer] = useState<Peer>();

  const navigate = useNavigate();

  const peers = useRef<{ [key: string]: MediaConnection }>({});

  type RoomParams = {
    id: string;
  };

  const { id: roomId } = useParams<RoomParams>();

  const [myUserId, setMyUserId] = useState<string>();

  const hostVideo = useRef<HTMLVideoElement>(null);
  const guestVideo = useRef<HTMLVideoElement>(null);

  const localAudioStream = useRef<MediaStreamTrack>();
  const localVideoStream = useRef<MediaStreamTrack>();

  const [error, setError] = useState<DOMException>();

  const [localAudioStreamEnabled, setLocalAudioStreamEnabled] = useState(true);
  const [localVideoStreamEnabled, setLocalVideoStreamEnabled] = useState(true);

  const [remoteStream, setRemoteStream] = useState<MediaStream | null>();
  const connections = useRef<{ [key: string]: RTCPeerConnection }>({});

  const [localStream, setLocalStream] = useState<MediaStream>();

  const callUser = (userId: string, localStream: MediaStream) => {
    const call = myPeer!.call(userId, localStream);
    console.log(`calling ${userId}`);
    call.on("stream", (stream) => {
      console.log("on stream");
      setRemoteStream(stream);
    });
    peers.current[userId] = call;
  };

  useEffect(() => {
    // init local stream before setting connection
    navigator?.mediaDevices
      ?.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        stream.getTracks().forEach((track: MediaStreamTrack) => {
          if (track.kind === "audio") localAudioStream.current = track;
          if (track.kind === "video") localVideoStream.current = track;
        });

        setLocalStream(stream);

        setMyPeer(
          new Peer(
            // @ts-ignore
            undefined,
            window.location.protocol === "https:"
              ? peerJsConfig
              : peerJsLocalConfig
          )
        );
      })
      .catch((e) => {
        setError(e);
        console.error(e);
      });
  }, []);

  useEffect(() => {
    if (localStream && myPeer && roomId) {
      hostVideo.current!.srcObject = localStream;

      myPeer.on("open", (id) => {
        console.log(`my id: ${id}`);
        setMyUserId(id);

        console.log(`join-room ${roomId}`);
        socket.emit("join-room", roomId, id);
      });

      myPeer.on("call", (call) => {
        console.log("on call");
        call.answer(localStream);
        call.on("stream", (stream) => {
          console.log("on remote stream");
          setRemoteStream(stream);
        });
      });

      socket.on("user-connected", async (userId) => {
        console.log(`user connected ${userId}`);
        callUser(userId, localStream);
      });

      socket.on("user-disconnected", async (userId) => {
        console.log(`user disconnected ${userId}`);
        peers.current[userId]?.close();
      });
    }
  }, [localStream, myPeer, roomId, callUser]);

  useEffect(() => {
    if (remoteStream) {
      guestVideo.current!.srcObject = remoteStream;
    }
  }, [remoteStream, guestVideo]);

  function setFullScreen(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    document.body.requestFullscreen();
  }

  function exitCall(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    Object.entries(peers.current).forEach(([userId, connection]) => {
      connection.close();
      delete connections.current[userId];
    });

    setRemoteStream(null);

    navigate("/test");
  }

  function switchAudio(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    localAudioStream.current!.enabled = !localAudioStream.current!.enabled;
    setLocalAudioStreamEnabled(localAudioStream.current!.enabled);
  }

  function switchVideo(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    localVideoStream.current!.enabled = !localVideoStream.current!.enabled;
    setLocalVideoStreamEnabled(localVideoStream.current!.enabled);
  }

  return (
    <div>
      <header>
        Room {roomId} <br /> my id {myUserId}
      </header>
      {error?.message && <p> Error {error.message}</p>}
      <div className="video-container">
        <Rnd
          default={{
            x: window.innerWidth - 150 - 20,
            y: window.innerHeight - 300 - 50 - 40,
            width: 150,
            height: 250,
          }}
          bounds="window"
        >
          <video
            muted={true}
            playsInline={true}
            autoPlay
            ref={hostVideo}
            className="small-video"
          />
        </Rnd>
      </div>

      <video
        autoPlay
        playsInline={true}
        ref={guestVideo}
        className="big-video"
      />

      <footer>
        {/* <button onClick={setFullScreen}>set full screen</button> */}

        <ButtonGroup
          sx={{
            width: "500px",
            display: "flex",
            justifyContent: "space-evenly",
          }}
        >
          <Button
            variant="contained"
            size="large"
            disableRipple
            disableFocusRipple
            disableTouchRipple
            sx={{
              minWidth: "50px",
              minHeight: "50px",
              width: "50px",
              height: "50px",
              // color: "white",
              bgcolor: (theme) => alpha(theme.palette.text.secondary, 0.5),
              ":focus": {
                bgcolor: (theme) => alpha(theme.palette.text.secondary, 0.5),
              },
            }}
            onClick={switchVideo}
          >
            {localVideoStreamEnabled ? <CameraAltIcon /> : <NoPhotography />}
          </Button>

          <Button
            variant="contained"
            color="error"
            size="large"
            sx={{
              minWidth: "50px",
              minHeight: "50px",
              width: "50px",
              height: "50px",
            }}
            onClick={exitCall}
          >
            <MdPhone />
          </Button>

          <Button
            variant="contained"
            size="large"
            sx={{
              minWidth: "50px",
              minHeight: "50px",
              width: "50px",
              height: "50px",
              // color: "white",
              bgcolor: (theme) => alpha(theme.palette.text.secondary, 0.5),
              ":focus": {
                bgcolor: (theme) => alpha(theme.palette.text.secondary, 0.5),
              },
            }}
            onClick={switchAudio}
          >
            {localAudioStreamEnabled ? <Mic /> : <MicOffIcon />}
          </Button>
        </ButtonGroup>
      </footer>
    </div>
  );
}
