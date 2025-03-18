import { configureStore } from "@reduxjs/toolkit";
import createReducer from "./rootReducer";

function configureAppStore(initialState = {}) {
  const store = configureStore({
    reducer: createReducer(),
    preloadedState: initialState,
    devTools: process.env.NODE_ENV !== "production",
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: true }),
  });

  return store;
}

export const store = configureAppStore();

export type AppDispatch = typeof store.dispatch;
export type AppState = ReturnType<typeof store.getState>;
