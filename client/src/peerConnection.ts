import { useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";

export type PeerEvents = {
  open: (id: string) => void;
  connection: (dataConnection: {}) => void;
  call: (mediaConnection: {}) => void;
};

class PeerConnection {
  connection: RTCPeerConnection;
  connections: RTCPeerConnection[];
  id: string;

  constructor() {
    this.connection = this.setupConnection();
    this.connections = [];
    this.id = uuid();

    // this.peerConnection.onicecandidate = (event) => {
    //   console.log("new ice candidate");
    //   if (event.candidate) {
    //     socket.emit("new-answerCandidate", event.candidate);
    //   } else {
    //     console.log("End of candidates.");
    //   }
    // };

    // this.peerConnection.ontrack = (event) => {
    //   // @ts-ignore
    //   //   remoteStream.current.addTrack(event.track);

    //   setRemoteStream(event.streams[0]);
    // };
  }
  private setupConnection(): RTCPeerConnection {
    return new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    });
  }

  addConnection(data: RTCPeerConnection) {
    this.connections.push(data);
  }
}

export default PeerConnection;

//     useEffect(() => {
//       navigator.mediaDevices
//         .getUserMedia({ video: true, audio: true })
//         .then((currentStream) => {
//           // @ts-ignore
//           setLocalStream(currentStream);
//           // @ts-ignore
//           myVideo.current.srcObject = currentStream;
//           // @ts-ignore
//           currentStream.getTracks().forEach((track) => {
//             peerConnection.current.addTrack(track, currentStream);
//           });
//         });
//     }, []);
//     useEffect(() => {
//       // @ts-ignore
//       if (remoteStream && remoteStream?.current) {
//         // @ts-ignore
//         userVideo.current.srcObject = remoteStream;
//       }
//     }, [remoteStream]);
//     useEffect(() => {
//       peerConnection.current.onicecandidate = (event) => {
//         console.log("new ice candidate");
//         if (event.candidate) {
//           socket.emit("new-iceCandidate", event.candidate);
//         } else {
//           console.log("End of candidates.");
//         }
//       };
//       peerConnection.current.createDataChannel("channel");
//       peerConnection.current.ontrack = (event) => {
//         // @ts-ignore
//         userVideo.current.srcObject = event.streams[0];
//       };
//   //   }, []);
//     async function processCall() {
//       const sessionDescription = await peerConnection.current.createOffer();
//       await peerConnection.current.setLocalDescription(sessionDescription);
//       sendCall(sessionDescription);
//     }
//     async function processAccept() {
//       peerConnection.current.setRemoteDescription(
//         // @ts-ignore
//         new RTCSessionDescription(remoteRTCMessage.current)
//       );
//       const sessionDescription = await peerConnection.current.createAnswer();
//       await peerConnection.current.setLocalDescription(sessionDescription);
//       answerCall(sessionDescription);
//     }
//     function sendCall(data: {}) {
//       callType.current = "call";
//       socket.emit("new-offer", data);
//     }
//     function answerCall(data: {}) {
//       callType.current = "answer";
//       socket.emit("new-answer", data);
//     }
// }
