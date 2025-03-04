import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { TGlobalReducerState, TOsType, TPanelsState, TTheme } from "@src/types";

const globalReducerInitialState: TGlobalReducerState = {
  osType: "Windows",
  theme: "System",
  panelsState: {
    showCodePanel: true,
    showTreePanel: true,
    focusedPanel: "design",
    showFileTree: false,
  },
};
const slice = createSlice({
  name: "global",
  initialState: globalReducerInitialState,
  reducers: {
    setOsType(state, action: PayloadAction<TOsType>) {
      const osType = action.payload;
      state.osType = osType;
    },

    setTheme(state, action: PayloadAction<TTheme>) {
      const theme = action.payload;
      state.theme = theme;
    },
    setPanelsState(state, action: PayloadAction<Partial<TPanelsState>>) {
      const panelsState = action.payload;
      state.panelsState = { ...state.panelsState, ...panelsState };
    },
    setFocusedPanel(state, action: PayloadAction<"code" | "design" | "tree">) {
      const focusedPanel = action.payload;
      state.panelsState.focusedPanel = focusedPanel;
    },
    setShowCodePanel(state, action: PayloadAction<boolean>) {
      const showCodePanel = action.payload;
      state.panelsState.showCodePanel = showCodePanel;
    },

    setShowTreePanel(state, action: PayloadAction<boolean>) {
      const showTreePanel = action.payload;
      state.panelsState.showTreePanel = showTreePanel;
    },
    setShowFileTree(state, action: PayloadAction<boolean>) {
      const showFileTree = action.payload;
      state.panelsState.showFileTree = showFileTree;
      if (showFileTree) {
        state.panelsState.focusedPanel = "tree";
      }
    },
  },
});
export const {
  setOsType,
  setTheme,
  setPanelsState,
  setFocusedPanel,
  setShowCodePanel,
  setShowTreePanel,
  setShowFileTree,
} = slice.actions;
export const GlobalReducer = slice.reducer;
