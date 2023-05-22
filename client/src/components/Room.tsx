import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import adapter from 'webrtc-adapter';
import "./Room.css";

import { socket } from "../socket";

export default function Room() {
  type CallType = "call" | "answer";
  const callType = useRef("call");

  const { id: roomId } = useParams();

  const myVideo = useRef(null);
  const userVideo = useRef(null);

  const [localStream, setLocalStream] = useState();
  const [remoteStream, setRemoteStream] = useState(new MediaStream());
  //   const remoteStream = useRef(new MediaStream());

  const peerConnection = useRef(
    new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    })
  );

  //   let remoteRTCMessage = useRef({});

  useEffect(() => {
    peerConnection.current.onicecandidate = (event) => {
      console.log("new ice candidate");
      if (event.candidate) {
        socket.emit("new-answerCandidate", event.candidate);
      } else {
        console.log("End of candidates.");
      }
    };

    // peerConnection.current.createDataChannel("channel");

    peerConnection.current.ontrack = (event) => {
      // @ts-ignore
      //   remoteStream.current.addTrack(event.track);

      console.log("should set remote stream");
      setRemoteStream(event.streams[0]);
      //   userVideo.current.addTrack(event.track);
    };

    getMediaDevices();

    // .onaddstream = event => {
    //     setRemoteStream(event.stream);
    //   };
  }, []);

  async function getMediaDevices() {
    await navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        // @ts-ignore
        setLocalStream(currentStream);

        // @ts-ignore
        myVideo.current.srcObject = currentStream;
        // @ts-ignore
        currentStream.getTracks().forEach((track) => {
          peerConnection.current.addTrack(track, currentStream);
        });
      });
  }

//   useEffect(() => {
//     navigator.mediaDevices
//       .getUserMedia({ video: true, audio: true })
//       .then((currentStream) => {
//         // @ts-ignore
//         setLocalStream(currentStream);

//         // @ts-ignore
//         myVideo.current.srcObject = currentStream;
//         // @ts-ignore
//         currentStream.getTracks().forEach((track) => {
//           peerConnection.current.addTrack(track, currentStream);
//         });
//       });
//   }, []);

  useEffect(() => {
    console.log("setting remoteStream");
    // @ts-ignore
    userVideo.current.srcObject = remoteStream;
  }, [remoteStream, userVideo]);

  useEffect(() => {
    console.log("emit join-room");
    // @ts-ignore
    socket.emit("join-room", roomId);

    // return () => {
    //   socket.disconnect();
    // };

    socket.on("user-connected", async () => {
      console.log("user connected");

      await processCall();
    });

    socket.on("user-disconnected", () => {
      console.log("user disconnected");

      // @ts-ignore
      userVideo.current.srcObject = null;
    });
  }, [roomId]);

  useEffect(() => {
    socket.on("offer", async (data) => {
      console.log("offer");
      //   remoteRTCMessage.current = data;
      //   setType("INCOMING_CALL");

    //   setTimeout(async () => {
        await processAccept(data);
    //   }, 2000);
    });

    socket.on("answerCandidate", (candidate) => {
      console.log("answerCandidate");
      peerConnection.current.addIceCandidate(
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

    socket.on("answer", async (data) => {
      console.log("answer");

      //   remoteRTCMessage.current = data;

      peerConnection.current.setRemoteDescription(
        // @ts-ignore
        new RTCSessionDescription(data)
      );
    });

    // socket.on("offerCandidate", (candidate) => {
    //   console.log("offerCandidate");

    //   if (peerConnection.current) {
    //     peerConnection?.current
    //       .addIceCandidate(new RTCIceCandidate(candidate))
    //       .then((data) => {
    //         console.log("SUCCESS");
    //       })
    //       .catch((err) => {
    //         console.log("Error", err);
    //       });
    //   }
    // });
  }, []);

  async function processCall() {
    const sessionDescription = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(sessionDescription);

    sendCall(sessionDescription);
  }

  async function processAccept(data: {}) {
    peerConnection.current.setRemoteDescription(
      // @ts-ignore
      new RTCSessionDescription(data)
    );

    const sessionDescription = await peerConnection.current.createAnswer();

    await peerConnection.current.setLocalDescription(sessionDescription);
    answerCall(sessionDescription);
  }

  function sendCall(data: {}) {
    callType.current = "call";
    socket.emit("new-offer", data);
  }

  function answerCall(data: {}) {
    callType.current = "answer";
    socket.emit("new-answer", data);
  }

  return (
    <div>
      <header>Room {roomId}</header>
      <button onClick={processCall}>make call</button>
      <video ref={myVideo} muted={true} autoPlay className="my-video"></video>
      <video ref={userVideo} autoPlay></video>
    </div>
  );
}
