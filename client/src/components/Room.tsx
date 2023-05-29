import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import IconButton from "@mui/material/IconButton";
import MdPhone from "@mui/icons-material/Phone";
import { Button, ButtonGroup, Chip } from "@mui/material";
import MicOffIcon from "@mui/icons-material/MicOff";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import { alpha } from "@mui/material";
import { Rnd } from "react-rnd";

import "./Room.css";

import { MediaConnection, Peer } from "peerjs";

import { socket } from "../socket";
import { Mic, NoPhotography } from "@mui/icons-material";

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      light: "#757ce8",
      main: "#3f50b5",
      dark: "#002884",
      contrastText: "#fff",
    },
    secondary: {
      light: "#ff7961",
      main: "#f44336",
      dark: "#ba000d",
      contrastText: "#000",
    },
  },
});

const peerJsLocalConfig = {
  host: "/",
  port: 3001,
};

const peerJsConfig = {
  host: "/",
  path: "peer",
};

export default function Room() {
  const myPeer = useRef(
    new Peer(
      // @ts-ignore
      undefined,
      window.location.protocol === "https:" ? peerJsConfig : peerJsLocalConfig
    )
  );

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

  const [localAudioStreamEnabled, setLocalAudioStreamEnabled] = useState(true);
  const [localVideoStreamEnabled, setLocalVideoStreamEnabled] = useState(true);

  const remoteStreamsObj: { [key: string]: MediaStream } = {};
  const [remoteStream, setRemoteStream] = useState<MediaStream>();
  const connections = useRef<{ [key: string]: RTCPeerConnection }>({});

  const [localStream, setLocalStream] = useState<MediaStream>();

  const callUser = (userId: string, localStream: MediaStream) => {
    const call = myPeer.current.call(userId, localStream);
    console.log(`calling ${userId}`);
    call.on("stream", (stream) => {
      console.log("on stream");
      setRemoteStream(stream);
    });
    peers.current[userId] = call;
  };

  useEffect(() => {
    // init local stream before setting connection
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        stream.getTracks().forEach((track: MediaStreamTrack) => {
          if (track.kind === "audio") localAudioStream.current = track;
          if (track.kind === "video") localVideoStream.current = track;
        });

        setLocalStream(stream);
      });
  }, []);

  useEffect(() => {
    if (localStream) {
      hostVideo.current!.srcObject = localStream;

      myPeer.current.on("open", (id) => {
        setMyUserId(id);
        if (roomId) {
          console.log(`join-room ${roomId} ${id}`);
          socket.emit("join-room", roomId, id);
        }
      });

      myPeer.current.on("disconnected", () => {
        console.log("reconnecting ");
        // myPeer.current.reconnect();
      });

      myPeer.current.on("close", () => {
        console.log("on close");
      });

      myPeer.current.on("error", (err) => {
        console.log("on error");
        console.log(err);
      });

      myPeer.current.on("call", (call) => {
        console.log("on call");
        call.answer(localStream);
        call.on("stream", (stream) => {
          console.log("on remote stream");
          setRemoteStream(stream);
        });

        call.on("error", (error) => {
          console.log("error ", error);
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
  }, [localStream]);

  useEffect(() => {
    if (remoteStream) {
      guestVideo.current!.srcObject = remoteStream;
    }
  }, [remoteStream, guestVideo]);

  function reconnect(
    event?: React.MouseEvent<HTMLButtonElement>,
    peerUuid?: string
  ) {
    if (event) event.preventDefault();

    myPeer.current.reconnect();

    // let registered = false;

    // if (registered) return;

    // return (() => {
    //   registered = true;
    //   const reconnectInterval = setInterval(() => {
    //     console.log("reconnecting...");
    //     console.log("socket.connected ", socket.connected);

    //     Object.values(connections.current).forEach((connection) =>
    //       connection.close()
    //     );
    //     connections.current = {};

    //     if (socket.connected && roomId) {
    //       console.log("joining-room");

    //       // @ts-ignore
    //       socket.emit("join-room", roomId, myUserId);

    //       clearInterval(reconnectInterval);
    //     }
    //   }, 1000);
    // })();
  }

  function setFullScreen(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    document.body.requestFullscreen();
  }

  function exitCall(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    Object.entries(connections.current).forEach(([userId, connection]) => {
      connection.close();
      delete connections.current[userId];
    });

    Object.keys(remoteStreamsObj).forEach((userId) => {
      delete remoteStreamsObj[userId];
    });
    // setRemoteStream();
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
      <header>Room {roomId}</header>
      <div className="video-container">
        <Rnd
          default={{
            x: 240,
            y: 500,
            width: 150,
            height: 250,
          }}
          // minWidth={150}
          // minHeight={250}
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
