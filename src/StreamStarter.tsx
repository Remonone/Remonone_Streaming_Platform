import React from 'react';
import {useAppDispatch, useAppSelector} from "./redux/hooks";
import {setStreaming} from "./redux/reducer/streamingSettings";

function StreamStarter() {
    const streaming = useAppSelector(state => state.streamReducer)
    const dispatcher = useAppDispatch()
    const handleStream = () => {
        navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
            .then((stream) => {
                dispatcher(setStreaming(stream))
            })
            .catch((error) => {
                console.error('Ошибка:', error);
            });
    }
    return (
        <div>
            <button disabled={!!streaming.stream} onClick={() => handleStream()}>Start Stream</button>
        </div>
    );
}

export default StreamStarter;