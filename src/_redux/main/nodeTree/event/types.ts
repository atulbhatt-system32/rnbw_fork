import { TNodePositionInfo, TNodeUid } from "@_api/types";

// Object representation of the Map for serialization
export type TNodeUidPositionsObject = {
  [key: string]: TNodePositionInfo;
};

export type TNodeEventReducerState = {
  currentFileContent: string;
  selectedNodeUids: TNodeUid[];
  nodeUidPositions: TNodeUidPositionsObject; // Changed from Map to serializable object
  currentFileUid: string;
};

export type TNodeEvent = {
  type: TNodeEventType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  param: any[];
} | null;
export type TNodeEventType =
  | "group"
  | "ungroup"
  | "add-node"
  | "copy-node-external"
  | "move-node";
