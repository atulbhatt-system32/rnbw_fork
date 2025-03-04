import { TNodeUid } from "@_api/index";

export type TProcessorReducerState = {
  navigatorDropdownType: TNavigatorDropdownType;
  favicon: string;

  activePanel: TPanelContext;
  clipboardData: TClipboardData | null;

  autoSave: boolean;
  wordWrap: boolean;

  didUndo: boolean;
  didRedo: boolean;
  loading: number;
  runningAction: number;
};

export type TNavigatorDropdownType = "workspace" | "project" | null;

export type TPanelContext =
  | "file"
  | "node"
  | "settings"
  | "styles"
  | "stage"
  | "code"
  | "cmdk"
  | "processor"
  | "hms"
  | "none";

export type TClipboardData = {
  panel: TPanelContext;
  type: "cut" | "copy" | null;
  uids: TNodeUid[];
};
