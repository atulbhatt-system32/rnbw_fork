import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import {
  TClipboardData,
  TNavigatorDropdownType,
  TPanelContext,
  TProcessorReducerState,
} from "./types";

const processorReducerInitialState: TProcessorReducerState = {
  navigatorDropdownType: null,
  favicon: "",

  activePanel: "none",
  clipboardData: null,

  autoSave: true,
  wordWrap: false,

  didUndo: false,
  didRedo: false,
  loading: 0,
  runningAction: 0,
};
const processorSlice = createSlice({
  name: "processor",
  initialState: processorReducerInitialState,
  reducers: {
    setNavigatorDropdownType(
      state,
      action: PayloadAction<TNavigatorDropdownType>,
    ) {
      const navigatorDropdownType = action.payload;
      state.navigatorDropdownType = navigatorDropdownType;
    },
    setFavicon(state, action: PayloadAction<string>) {
      const favicon = action.payload;
      state.favicon = favicon;
    },

    setActivePanel(state, action: PayloadAction<TPanelContext>) {
      const activePanel = action.payload;
      state.activePanel = activePanel;
    },
    setClipboardData(state, action: PayloadAction<TClipboardData | null>) {
      const clipboardData = action.payload;
      state.clipboardData = clipboardData;
    },

    setAutoSave(state, action: PayloadAction<boolean>) {
      const autoSave = action.payload;
      state.autoSave = autoSave;
    },
    setWordWrap(state, action: PayloadAction<boolean>) {
      const wordWrap = action.payload;
      state.wordWrap = wordWrap;
    },

    setDidUndo(state, action: PayloadAction<boolean>) {
      const didUndo = action.payload;
      state.didUndo = didUndo;
    },
    setDidRedo(state, action: PayloadAction<boolean>) {
      const didRedo = action.payload;
      state.didRedo = didRedo;
    },
    setLoadingTrue(state) {
      state.loading += 1;
    },
    setLoadingFalse(state) {
      state.loading = Math.max(0, state.loading - 1);
    },
    addRunningAction(state) {
      state.runningAction += 1;
    },
    removeRunningAction(state) {
      state.runningAction = Math.max(0, state.runningAction - 1);
    },
  },
});
export const {
  setNavigatorDropdownType,
  setFavicon,

  setActivePanel,
  setClipboardData,

  setAutoSave,
  setWordWrap,

  setDidUndo,
  setDidRedo,
  setLoadingTrue,
  setLoadingFalse,

  addRunningAction,
  removeRunningAction,
} = processorSlice.actions;
export const ProcessorReduer = processorSlice.reducer;
