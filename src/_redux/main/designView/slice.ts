import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { DesignViewSyncConfigs, TDesignViewReducerState } from "./types";

const DesignViewReducerInitialState: TDesignViewReducerState = {
  iframeLoading: false,
  linkToOpen: null,
  syncConfigs: {},
};
const DesignViewSlice = createSlice({
  name: "DesignView",
  initialState: DesignViewReducerInitialState,
  reducers: {
    setIframeLoading(state, actions: PayloadAction<boolean>) {
      const iframeLoading = actions.payload;
      state.iframeLoading = iframeLoading;
    },
    setLinkToOpen(state, actions: PayloadAction<string | null>) {
      const linkToOpen = actions.payload;
      state.linkToOpen = linkToOpen;
    },
    setSyncConfigs(state, action: PayloadAction<DesignViewSyncConfigs>) {
      const syncConfigs = action.payload;
      state.syncConfigs = syncConfigs;
    },
  },
});

export const { setIframeLoading, setLinkToOpen, setSyncConfigs } =
  DesignViewSlice.actions;
export const DesignViewReducer = DesignViewSlice.reducer;
