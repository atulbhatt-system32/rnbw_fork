import { TFileNodeTreeData } from "@src/api";

export type ProjectEventType = "reloadPage" | "openFile";

export interface openFileEventData {
  fileUid: string;
  fileTree: TFileNodeTreeData;
}

interface reloadEventData {
  message?: string;
}

type ProjectEventDataMap = {
  reloadPage: reloadEventData;
  openFile: openFileEventData;
};

export interface ProjectEvent<T extends ProjectEventType = ProjectEventType> {
  type: T;
  data: ProjectEventDataMap[T];
}
