import { configureStore } from "@reduxjs/toolkit";
import createReducer from "./rootReducer";
import {
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";

function configureAppStore(initialState = {}) {
  const store = configureStore({
    reducer: createReducer(),
    preloadedState: initialState,
    devTools: process.env.NODE_ENV !== "production",
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }),
  });

  return store;
}

export const store = configureAppStore();

export type AppDispatch = typeof store.dispatch;
export type AppState = ReturnType<typeof store.getState>;
