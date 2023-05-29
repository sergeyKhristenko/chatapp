import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import adapter from "webrtc-adapter";

import { v4 as uuid } from "uuid";

import "./Room.css";

import { socket } from "../socket";

export default function Room() {
  type CallType = "call" | "answer";
  const callType = useRef("call");

  type RoomParams = {
    id: string;
  };

  const { id: roomId } = useParams<RoomParams>();

  const myVideo = useRef(null);

  let localStream: MediaStream | null = null;

  const localAudioStream = useRef<MediaStreamTrack>();
  const localVideoStream = useRef<MediaStreamTrack>();

  const [localAudioStreamEnabled, setLocalAudioStreamEnabled] = useState(true);
  const [localVideoStreamEnabled, setLocalVideoStreamEnabled] = useState(true);

  const remoteStreamsObj: { [key: string]: MediaStream } = {};
  const [remoteStreams, setRemoteStreams] = useState<{
    [key: string]: MediaStream;
  }>({});
  const connections = useRef<{ [key: string]: RTCPeerConnection }>({});

  const myUserId = useRef(uuid());

  const peerConnectionConfig = {
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
    ],
  };

  useEffect(() => {
    // init local stream before setting connection
    getMediaDevices();
  }, []);

  async function getMediaDevices() {
    return await navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((currentStream) => {
        localStream = currentStream;

        // @ts-ignore
        myVideo.current.srcObject = currentStream;

        return currentStream;
      });
  }

  const setUpPeer = (peerUuid: string, initCall = false) => {
    if (connections.current[peerUuid]) {
      console.log(`connection with ${peerUuid} already established`);
      return;
    }

    console.log(`setupPeer ${peerUuid}`);
    connections.current[peerUuid] = new RTCPeerConnection(peerConnectionConfig);
    connections.current[peerUuid].onicecandidate = (event) =>
      gotIceCandidate(event, peerUuid);
    connections.current[peerUuid].ontrack = (event) =>
      gotRemoteStream(event, peerUuid);

    connections.current[peerUuid].onconnectionstatechange = (event) => {
      console.log(
        "onconnections.currenttatechange: ",
        connections.current[peerUuid].connectionState
      );
      console.log("myUserId ", myUserId.current);
      console.log(peerUuid);

      switch (connections.current[peerUuid].connectionState) {
        case "disconnected":
        case "failed":
          //   console.log("dropping all connections.current");
          //   Object.entries(connections.current).forEach(([userId, connection]) => {
          //     console.log(`closing connection for: ${userId}`);
          //     connection.close();
          //     // delete connections.current[userId];
          //   });
          //   connections.current = {};

          //   Object.keys(remoteStreamsObj).forEach((userId) => {
          //     delete remoteStreamsObj[userId];
          //   });
          //   setRemoteStreams({ ...remoteStreamsObj });
          //   myUserId = uuid();
          //   reconnect();
          // connections.current[peerUuid]
          //   .createOffer({ iceRestart: true })
          //   .then((description) => {
          //     connections.current[peerUuid].setLocalDescription(description);
          //     sendCall(description, peerUuid, myUserId);
          //   });
          reconnect();
          break;
      }
    };
    // connections.current[peerUuid].oniceconnections.currenttatechange = (event) =>
    //   checkPeerDisconnect(event, peerUuid);
    // remoteStreams[peerUuid] .addTrack(localStream);

    // @ts-ignore
    localStream.getTracks().forEach((track: MediaStreamTrack) => {
      console.log("track from localstream");

      if (track.kind === "audio") localAudioStream.current = track;
      if (track.kind === "video") localVideoStream.current = track;

      // @ts-ignore
      connections.current[peerUuid].addTrack(track, localStream);
    });

    if (initCall) {
      connections.current[peerUuid].createOffer().then((description) => {
        connections.current[peerUuid].setLocalDescription(description);
        sendCall(description, peerUuid, myUserId.current);
      });
    }
  };

  function gotRemoteStream(event: RTCTrackEvent, userId: string) {
    console.log(`gotRemoteStream. UserId: ${userId}`);

    // @ts-ignore
    remoteStreamsObj[userId] = event.streams[0];

    setRemoteStreams({ ...remoteStreamsObj, [userId]: event.streams[0] });
  }

  function gotIceCandidate(event: RTCPeerConnectionIceEvent, userId: string) {
    console.log("gotIceCandidate");
    if (event.candidate) {
      socket.emit(
        "new-answerCandidate",
        event.candidate,
        userId,
        myUserId.current
      );
    } else {
      console.log("End of candidates.");
    }
  }

  function reconnect(
    event?: React.MouseEvent<HTMLButtonElement>,
    peerUuid?: string
  ) {
    if (event) event.preventDefault();

    let registered = false;

    if (registered) return;

    return (() => {
      registered = true;
      const reconnectInterval = setInterval(() => {
        console.log("reconnecting...");
        console.log("socket.connected ", socket.connected);

        Object.values(connections.current).forEach((connection) =>
          connection.close()
        );
        connections.current = {};

        if (socket.connected && roomId) {
          console.log("joining-room");
          socket.emit("join-room", roomId, myUserId.current);

          clearInterval(reconnectInterval);
        }
      }, 1000);
    })();
  }

  useEffect(() => {
    console.log("emit join-room");
    console.log(`myid ${myUserId.current}`);

    if (roomId) {
      setupConnection().then(() => {
        socket.emit("join-room", roomId, myUserId.current);
      });
    }

    socket.on("user-connected", async (userId) => {
      console.log("user connected");

      await setUpPeer(userId, true);
    });

    socket.on("connect_error", async (userId) => {
      console.log("connect_error");
      reconnect();
    });

    socket.on("user-disconnected", (userId) => {
      console.log("user disconnected ", userId);

      // @ts-ignore
      delete remoteStreamsObj[userId];
      setRemoteStreams({ ...remoteStreamsObj });

      connections.current[userId]?.close();
      delete connections.current[userId];
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId]);

  async function setupConnection() {
    if (!localStream) await getMediaDevices();
  }

  useEffect(() => {
    socket.on("offer", async (data, userIdTo, userIdFrom) => {
      console.log(`offer to: ${userIdTo}`);
      console.log(`offer from: ${userIdFrom}`);
      console.log(`my id: ${myUserId.current}`);

      if (userIdTo !== myUserId.current) return;

      await setUpPeer(userIdFrom);
      await processAccept(data, userIdTo, userIdFrom);
    });

    socket.on("answerCandidate", (candidate, userIdTo, userIdFrom) => {
      if (userIdTo !== myUserId.current) return;

      // @ts-ignore
      connections.current[userIdFrom].addIceCandidate(
        // @ts-ignore
        new RTCIceCandidate(candidate)
      );
    });

    socket.on("answer", async (data, userIdTo, userIdFrom) => {
      console.log(`answer to: ${userIdTo}`);
      console.log(`answer from: ${userIdFrom}`);
      console.log(
        "current connections.current: ",
        Object.keys(connections.current)
      );

      if (userIdFrom !== myUserId.current) return;
      console.log(
        `connections.currenttate ${connections.current[userIdTo].connectionState}`
      );
      if (connections.current[userIdTo].connectionState === "connected") return;

      connections.current[userIdTo]
        .setRemoteDescription(
          // @ts-ignore
          new RTCSessionDescription(data)
        )
        .catch(console.error);
    });
  }, []);

  //   async function processCall(userIdTo: string, userIdFrom: string) {
  //     const connection = connections.current[userIdFrom];

  //     const sessionDescription = await connection.createOffer();
  //     await connection.setLocalDescription(sessionDescription);

  //     sendCall(sessionDescription, userIdTo, userIdFrom);
  //   }

  async function processAccept(data: {}, userIdTo: string, userIdFrom: string) {
    const connection = connections.current[userIdFrom];

    connection
      .setRemoteDescription(
        // @ts-ignore
        new RTCSessionDescription(data)
      )
      .catch(console.error);

    const sessionDescription = await connection.createAnswer();

    try {
      await connection.setLocalDescription(sessionDescription);
      answerCall(sessionDescription, userIdTo, userIdFrom);
    } catch (e) {
      console.log(e);
    }
  }

  function sendCall(data: {}, userIdTo: string, userIdFrom: string) {
    callType.current = "call";
    console.log(`senting offer to ${userIdTo}`);
    socket.emit("new-offer", data, userIdTo, userIdFrom);
  }

  function answerCall(data: {}, userIdTo: string, userIdFrom: string) {
    callType.current = "answer";

    socket.emit("new-answer", data, userIdTo, userIdFrom);
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
    socket.disconnect();

    Object.keys(remoteStreamsObj).forEach((userId) => {
      delete remoteStreamsObj[userId];
    });
    setRemoteStreams({ ...remoteStreamsObj });
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

      <video
        ref={myVideo}
        muted={true}
        playsInline={true}
        autoPlay
        className="my-video"
      ></video>

      {Object.entries(remoteStreams).map(([userId, stream]) => {
        return (
          <video
            autoPlay
            playsInline={true}
            key={userId}
            ref={(ref) => {
              if (ref) ref.srcObject = stream;
            }}
          />
        );
      })}

      <footer>
        <button onClick={setFullScreen}>set full screen</button>
        <button onClick={exitCall}>exit call</button>
        <button onClick={reconnect}>reconnect</button>

        <button
          onClick={switchAudio}
          disabled={!localAudioStream.current}
          className={`enabled-${localAudioStreamEnabled}`}
        >
          audio
        </button>
        <button
          onClick={switchVideo}
          disabled={!localVideoStream.current}
          className={`enabled-${localVideoStreamEnabled}`}
        >
          video
        </button>
      </footer>
    </div>
  );
}
