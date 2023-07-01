import React, {Dispatch, useEffect, useRef, useState} from 'react';
import './App.css';
import StreamStarter from "./StreamStarter";
import {useAppDispatch, useAppSelector} from "./redux/hooks";
import {setStreaming} from "./redux/reducer/streamingSettings";
import {Socket} from "socket.io-client";


async function makeOffer(id: string, stream: React.MutableRefObject<MediaStream | null>, peers: React.MutableRefObject<{[key: string]: RTCPeerConnection} | null>, iceCandidates: React.MutableRefObject<{[key: string]: RTCIceCandidate[]} | null>, socket: Socket){

    let peer = new RTCPeerConnection();
    peer.onicecandidate = (e) => {
        if(e.candidate){
            console.log(id)
            iceCandidates.current = iceCandidates.current === null ? {[id]: [e.candidate]} : {...iceCandidates.current, [id]: (iceCandidates.current[id] !== undefined ? [...iceCandidates.current[id], e.candidate] : [e.candidate])}
            console.log(iceCandidates.current)
        }
    }
    stream.current!.getTracks().forEach(track => peer.addTrack(track, stream.current!));
    peer.createOffer()
        .then((offer)=>{
            peer.setLocalDescription(offer)
                .then(()=>{
                    console.log("Send an offer to:", id)
                    socket.emit('offer', {
                        id, offer: peer.localDescription
                    })
                })
        });
    peers.current = peers.current === null ? {[id]: peer} : {...peers.current, [id]: peer}
}

function App() {
  const streamSettings = useAppSelector(state => state.streamReducer);
  const dispatcher = useAppDispatch();

  const stream = useRef<MediaStream | null>(null);
  const isStarted = useRef<boolean>(true)
  const isFinished = useRef<boolean>(false)
  const peers = useRef<{[key: string]: RTCPeerConnection} | null>(null);
  const iceCandidates = useRef<{[key: string]: RTCIceCandidate[]} | null>(null);

  useEffect(()=> {
      streamSettings.clientPeer.ontrack = (e) => {
          isStarted.current = false
          dispatcher(setStreaming(e.streams[0]))
      }
  }, [])

  useEffect(()=> {

    //CLIENT

    function onConnect(){
      console.log("Connected to websocket")
    }
    function onOffer(data: {id: string, offer: RTCSessionDescriptionInit}){
        streamSettings.clientPeer.setRemoteDescription(data.offer)
          .then(()=> {
            return streamSettings.clientPeer.createAnswer()
          })
          .then((answer)=> {
            return streamSettings.clientPeer.setLocalDescription(answer)
          })
          .then(()=>{
              streamSettings.socket.emit('answerToHost', streamSettings.clientPeer.localDescription)
          })
          .catch((error)=>{
            console.error("Error during handling an offer:", error)
          })
    }

    function onIceCandidate(candidate: string){
      let iceCandidate = new RTCIceCandidate(JSON.parse(candidate))
        streamSettings.clientPeer.addIceCandidate(iceCandidate)
          .catch((error)=> {
            console.error("Error while adding ICE Candidate:", error)
          })
    }

    //HOST

    function onPing(data: string[]){
      for(let id of data){
        makeOffer(id, stream, peers, iceCandidates, streamSettings.socket)
      }
    }

    function askOffer(id: string){
        makeOffer(id, stream, peers, iceCandidates, streamSettings.socket)
    }

    function receiveAnswer(data: {id: string, answer: RTCSessionDescriptionInit}){
        const peer = (peers.current!)[data.id]
        peer.setRemoteDescription(new RTCSessionDescription(data.answer))
            .then(()=> {
                iceCandidates.current![data.id].forEach(candidate =>
                    streamSettings.socket.emit('icecandidate', {id: data.id, candidate: JSON.stringify(candidate)})
                )
            })
    }

    function onHostDisconnected(){
        stream.current?.getTracks().forEach(track => {
            track.stop()
            stream.current?.removeTrack(track)
        })
    }

    streamSettings.socket.on('ping', onPing);
    streamSettings.socket.on('askOffer', askOffer);
    streamSettings.socket.on('answer', receiveAnswer);
    streamSettings.socket.on('offer', onOffer)

   streamSettings.socket.on('icecandidate', onIceCandidate)

   streamSettings.socket.on('hostDisconnected', onHostDisconnected)
  }, [])

    useEffect(()=> {
        if(streamSettings.stream !== undefined && isStarted.current){
            stream.current = streamSettings.stream
            streamSettings.socket.emit('ping')
        }
    }, [streamSettings.stream])


  return (
    <div className="App">
      <StreamStarter/>
        <video controls ref={(ref)=>{
            if(ref){
                    ref.srcObject = streamSettings.stream || null
            }
        }}></video>
    </div>
  );
}

export default App;
