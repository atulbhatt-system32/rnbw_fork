export type TGlobalReducerState = {
  osType: TOsType;
  theme: TTheme;
  panelsState: TPanelsState;
};

export type TOsType = "Windows" | "Mac" | "Linux";
export type TTheme = "Light" | "Dark" | "System";
export type TPanelsState = {
  showCodePanel: boolean;
  showTreePanel: boolean;
  focusedPanel: "code" | "design" | "tree";
  showFileTree: boolean;
};
