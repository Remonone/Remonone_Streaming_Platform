import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import io, {Socket} from "socket.io-client";

export interface StreamingSettings {
    stream: MediaStream | undefined
    socket: Socket,
    clientPeer: RTCPeerConnection

    peers: {
        [key: string]: RTCPeerConnection
    },
    iceCandidates: {
        [key: string]: RTCIceCandidate[]
    }
}

const location = `http://${process.env["REACT_APP_IP"]}:${process.env["REACT_APP_PORT"]}`;
console.log(location)
const socket = io(location)

const initialState : StreamingSettings = {
    stream: undefined,
    socket,
    clientPeer: new RTCPeerConnection(),
    peers: {},
    iceCandidates: {}
}

export const streamSlice = createSlice({
    name: 'counter',
    initialState,
    reducers: {
        setStreaming: (state, action: PayloadAction<MediaStream>) => {
            return {...state, stream: action.payload}
        },
        addPeer: (state, action) => {

            return {
                ...state,
                peers: {
                    ...state.peers,
                    [action.payload.id]: action.payload.peer
                }
            }
        },
        addIceCandidate: (state, action) => {
            let newCandidateList = state.iceCandidates[action.payload.id] === undefined ? [action.payload.candidate] : [...state.iceCandidates[action.payload.id], action.payload.candidate]
            return {
                ...state,
                iceCandidates: {
                    ...state.iceCandidates,
                    [action.payload.id]: newCandidateList
                }
            }
        }
    },
})

export const { setStreaming, addPeer, addIceCandidate } = streamSlice.actions

export default streamSlice.reducer