import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import { socket } from "../socket";

export default function Room() {
  type CallType = "call" | "answer";
  const callType = useRef("call");

  const { id: roomId } = useParams();

  const myVideo = useRef(null);
  const userVideo = useRef(null);

  const [localStream, setLocalStream] = useState();
  const [remoteStream, setRemoteStream] = useState();

  const peerConnection = useRef(
    new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    })
  );

  let remoteRTCMessage = useRef({});

  useEffect(() => {
    navigator.mediaDevices
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
  }, []);

  useEffect(() => {
    // @ts-ignore
    if (remoteStream && remoteStream?.current) {
      // @ts-ignore
      userVideo.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    // @ts-ignore
    socket.emit("join-room", roomId);

    return () => {
      socket.disconnect();
    };
  }, [roomId]);

  socket.on("user-connected", () => {
    console.log("user connected");
  });

  useEffect(() => {
    peerConnection.current.onicecandidate = (event) => {
      console.log("new ice candidate");
      if (event.candidate) {
        socket.emit("new-iceCandidate", event.candidate);
      } else {
        console.log("End of candidates.");
      }
    };

    peerConnection.current.createDataChannel("channel");

    peerConnection.current.ontrack = (event) => {
      // @ts-ignore
      userVideo.current.srcObject = event.streams[0];
    };

    // .onaddstream = event => {
    //     setRemoteStream(event.stream);
    //   };
  }, []);

  useEffect(() => {
    socket.on("offer", async (data) => {
      console.log("offer");
      remoteRTCMessage.current = data;
      //   setType("INCOMING_CALL");

      await processAccept();
    });

    socket.on("answer", async (data) => {
      console.log("answer");

      remoteRTCMessage.current = data;

      peerConnection.current.setRemoteDescription(
        // @ts-ignore
        new RTCSessionDescription(remoteRTCMessage.current)
      );
    });

    socket.on("answerCandidate", (candidate) => {
      console.log("answerCandidate");
      if (remoteRTCMessage.current) {
        remoteRTCMessage?.current
          //@ts-ignore
          .addIceCandidate(new RTCIceCandidate(candidate))
          .then((data: {}) => {
            console.log("SUCCESS");
          })
          .catch((err: {}) => {
            console.log("Error", err);
          });
      }
    });

    socket.on("iceCandidate", (candidate) => {
      console.log("offerCandidate");

      if (peerConnection.current) {
        peerConnection?.current
          .addIceCandidate(new RTCIceCandidate(candidate))
          .then((data) => {
            console.log("SUCCESS");
          })
          .catch((err) => {
            console.log("Error", err);
          });
      }
    });
  }, []);

  async function processCall() {
    const sessionDescription = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(sessionDescription);

    sendCall(sessionDescription);
  }

  async function processAccept() {
    peerConnection.current.setRemoteDescription(
      // @ts-ignore
      new RTCSessionDescription(remoteRTCMessage.current)
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
      welcome to : {roomId}
      <button onClick={processCall}>make call</button>
      <video ref={myVideo} autoPlay></video>
      <video ref={userVideo} autoPlay></video>
    </div>
  );
}
