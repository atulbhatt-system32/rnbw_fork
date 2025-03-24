import { TNodeUid } from "@_api/types";
import { TProjectContext } from "../fileTree";

export type TFileHandlerCollection = {
  [uid: TNodeUid]: FileSystemHandle;
};
export type TProjectReducerState = {
  projectHandlers: TFileHandlerCollection;
  currentProjectFileHandle: FileSystemDirectoryHandle | null;
  fileHandlers: TFileHandlerCollection;
};

export type TRecentProject = {
  name: string;
  handler: FileSystemDirectoryHandle | null;
  context: TProjectContext;
};
