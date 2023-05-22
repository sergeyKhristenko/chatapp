import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import adapter from "webrtc-adapter";
import PeerConnection from "../peerConnection";

import { v4 as uuid } from "uuid";

import "./Room.css";

// import { randomUUID } from "crypto";
import { socket } from "../socket";

export default function Room() {
  type CallType = "call" | "answer";
  const callType = useRef("call");

  type RoomParams = {
    id: string;
  };

  const { id: roomId } = useParams<RoomParams>();

  const myVideo = useRef(null);
  //   const userVideo = useRef(null);

  let localStream: MediaStream | null = null;

  //   const [localStream, setLocalStream] = useState<MediaStream>();
  //   const [remoteStream, setRemoteStream] = useState(new MediaStream());
  //   const remoteStream = useRef(new MediaStream());

  //   const remoteStreams = useRef<{ [key: string]: MediaStream }>({});
  const remoteStreamsObj = {};
  const [remoteStreams, setRemoteStreams] = useState<{
    [key: string]: MediaStream;
  }>({});
  const connections = useRef<{ [key: string]: RTCPeerConnection }>({});

  const myUserId = uuid();

  //   const peerConnection = useRef(
  //     new RTCPeerConnection({
  //       iceServers: [
  //         {
  //           urls: "stun:stun.l.google.com:19302",
  //         },
  //       ],
  //     })
  //   );
  const peerConnectionConfig = {
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
    ],
  };

  //   function setupPeerConnection(userId: string) {
  //     const newConnection = new RTCPeerConnection({
  //       iceServers: [
  //         {
  //           urls: "stun:stun.l.google.com:19302",
  //         },
  //       ],
  //     });

  //     connections.current[userId] = newConnection;

  //     console.log(`connecting to ${userId}`);

  //     newConnection.onicecandidate = (event) => {
  //       console.log("new ice candidate");
  //       if (event.candidate) {
  //         socket.emit("new-answerCandidate", event.candidate, userId);
  //       } else {
  //         console.log("End of candidates.");
  //       }
  //     };
  //   }

  useEffect(() => {
    // init local stream before setting connection
    getMediaDevices();
  }, []);

  async function getMediaDevices() {
    return await navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        // @ts-ignore

        localStream = currentStream;

        // @ts-ignore
        myVideo.current.srcObject = currentStream;

        return currentStream;

        // currentStream.getTracks().forEach((track) => {
        //   peerConnection.current.addTrack(track, currentStream);
        // });
      });
  }

  //   useEffect(() => {
  //     console.log("setting remoteStream");
  //     // @ts-ignore
  //     userVideo.current.srcObject = remoteStream;
  //   }, [remoteStream, userVideo]);

  function setUpPeer(peerUuid: string, initCall = false) {
    console.log(`setupPeer ${peerUuid}`);
    connections.current[peerUuid] = new RTCPeerConnection(peerConnectionConfig);
    connections.current[peerUuid].onicecandidate = (event) =>
      gotIceCandidate(event, peerUuid);
    connections.current[peerUuid].ontrack = (event) =>
      gotRemoteStream(event, peerUuid);
    // connections.current[peerUuid].oniceconnectionstatechange = (event) =>
    //   checkPeerDisconnect(event, peerUuid);
    // remoteStreams[peerUuid] .addTrack(localStream);

    // @ts-ignore
    localStream.getTracks().forEach((track: MediaStreamTrack) => {
      // @ts-ignore
      connections.current[peerUuid].addTrack(track, localStream);
    });

    if (initCall) {
      connections.current[peerUuid].createOffer().then((description) => {
        connections.current[peerUuid].setLocalDescription(description);
        sendCall(description, peerUuid, myUserId);
      });
    }
  }

  function gotRemoteStream(event: RTCTrackEvent, userId: string) {
    console.log(`gotRemoteStream. UserId: ${userId}`);

    // @ts-ignore
    remoteStreamsObj[userId] = event.streams[0];

    setRemoteStreams({ ...remoteStreamsObj, [userId]: event.streams[0] });
    // remoteStreams.current[userId] = event.streams[0];
  }

  function gotIceCandidate(event: RTCPeerConnectionIceEvent, userId: string) {
    if (event.candidate) {
      socket.emit("new-answerCandidate", event.candidate, userId, myUserId);
    } else {
      console.log("End of candidates.");
    }
  }

  useEffect(() => {
    console.log("emit join-room");

    if (roomId) {
      setupConnection().then(() => {
        socket.emit("join-room", roomId, myUserId);
      });
    }

    // return () => {
    //   socket.disconnect();
    // };

    socket.on("user-connected", async (userId) => {
      console.log("user connected");

      await setUpPeer(userId, true);

      //   // if(userId === myUserId) return;

      //   await setupConnection(userId);

      //   console.log(connections.current);

      //   await processCall(userId);

      //   // @ts-ignore
      //   localStream.getTracks().forEach((track: MediaStreamTrack) => {
      //     // @ts-ignore
      //     connections.current[userId].addTrack(track, localStream);
      //   });

      //   connections.current[userId].ontrack = (event) => {
      //     // @ts-ignore
      //     //   remoteStream.current.addTrack(event.track);
      //     console.log("ontrack");
      //     console.log(event);
      //     setRemoteStreams({ ...remoteStreams, [userId]: event.streams[0] });
      //     //   if (!remoteStreams.current[userId])
      //     //     remoteStreams.current[userId] = new MediaStream();
      //     //   remoteStreams.current[userId].addTrack(event.track);
      //     console.log(remoteStreams);
      //     //   userVideo.current.addTrack(event.track);
      //   };
    });

    socket.on("user-disconnected", () => {
      console.log("user disconnected");

      // @ts-ignore
      //   userVideo.current.srcObject = null;
    });
  }, [roomId]);

  async function setupConnection() {
    if (!localStream) await getMediaDevices();

    // if(userId === myUserId) return;

    // console.log(connections.current);
    // if (connections.current[userId]) return;

    // // await setupPeerConnection(userId);

    // console.log(connections.current);

    // // await processCall(userId);

    // // @ts-ignore
    // localStream.getTracks().forEach((track: MediaStreamTrack) => {
    //   // @ts-ignore
    //   connections.current[userId].addTrack(track, localStream);
    // });

    // connections.current[userId].ontrack = (event) => {
    //   // @ts-ignore
    //   //   remoteStream.current.addTrack(event.track);
    //   console.log("ontrack");
    //   console.log(event);
    //   setRemoteStreams({ ...remoteStreams, [userId]: event.streams[0] });
    //   //   if (!remoteStreams.current[userId])
    //   //     remoteStreams.current[userId] = new MediaStream();
    //   //   remoteStreams.current[userId].addTrack(event.track);
    //   console.log(remoteStreams);
    //   //   userVideo.current.addTrack(event.track);
    // };
  }

  useEffect(() => {
    socket.on("offer", async (data, userIdTo, userIdFrom) => {
      console.log(`offer to: ${userIdTo}`);
      console.log(`offer from: ${userIdFrom}`);
      console.log(`my id: ${myUserId}`);

      if (userIdTo !== myUserId) return;

      await setUpPeer(userIdFrom);

      //   remoteStreams.current[userId] = new MediaStream();

      //   remoteRTCMessage.current = data;
      //   setType("INCOMING_CALL");

      //   setTimeout(async () => {
      await processAccept(data, userIdTo, userIdFrom);
      //   }, 2000);
    });

    socket.on("answerCandidate", (candidate, userIdTo, userIdFrom) => {
      if (userIdTo !== myUserId) return;

      // @ts-ignore
      connections.current[userIdFrom].addIceCandidate(
        // @ts-ignore
        new RTCIceCandidate(candidate)
      );

      //   if (remoteRTCMessage.current) {
      //     remoteRTCMessage?.current
      //       //@ts-ignore
      //       .addIceCandidate(new RTCIceCandidate(candidate))
      //       .then((data: {}) => {
      //         console.log("SUCCESS");
      //       })
      //       .catch((err: {}) => {
      //         console.log("Error", err);
      //       });
      //   }
    });

    socket.on("answer", async (data, userIdTo, userIdFrom) => {
      console.log(`answer to: ${userIdTo}`);
      console.log(`answer from: ${userIdFrom}`);
      console.log(connections.current);

      if (userIdFrom !== myUserId) return;

      //   if (connections.current[userId]) return;
      //   await setUpPeer(userId);

      //   remoteRTCMessage.current = data;
      //   if (connections.current[userId]) return;

      connections.current[userIdTo].setRemoteDescription(
        // @ts-ignore
        new RTCSessionDescription(data)
      );

      //   remoteStreams.current[userId] = new MediaStream();
    });
  }, []);

  async function processCall(userIdTo: string, userIdFrom: string) {
    const connection = connections.current[userIdFrom];

    const sessionDescription = await connection.createOffer();
    await connection.setLocalDescription(sessionDescription);

    sendCall(sessionDescription, userIdTo, userIdFrom);
  }

  async function processAccept(data: {}, userIdTo: string, userIdFrom: string) {
    const connection = connections.current[userIdFrom];

    connection.setRemoteDescription(
      // @ts-ignore
      new RTCSessionDescription(data)
    );

    const sessionDescription = await connection.createAnswer();

    await connection.setLocalDescription(sessionDescription);
    answerCall(sessionDescription, userIdTo, userIdFrom);
  }

  function sendCall(data: {}, userIdTo: string, userIdFrom: string) {
    callType.current = "call";
    socket.emit("new-offer", data, userIdTo, userIdFrom);
  }

  function answerCall(data: {}, userIdTo: string, userIdFrom: string) {
    callType.current = "answer";

    socket.emit("new-answer", data, userIdTo, userIdFrom);
  }

  return (
    <div>
      <header>Room {roomId}</header>
      {/* <button onClick={processCall}>make call</button> */}
      <video ref={myVideo} muted={true} autoPlay className="my-video"></video>

      {Object.entries(remoteStreams).map(([userId, stream]) => {
        return (
          <video
            autoPlay
            key={userId}
            muted
            ref={(ref) => {
              if (ref) ref.srcObject = stream;
            }}
          />
        );

      })}
    </div>
  );
}
