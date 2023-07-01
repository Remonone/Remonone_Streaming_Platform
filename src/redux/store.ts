import {configureStore} from "@reduxjs/toolkit";
import streamReducer from "./reducer/streamingSettings";

export const store = configureStore({
    reducer: {
        streamReducer
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: false
    })
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch