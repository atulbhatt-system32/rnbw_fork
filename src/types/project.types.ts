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

export type TNodeUid = string;
export type TBasicNodeData = {
  valid: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TNodeData = TBasicNodeData & { [propName: string]: any };
export type TNode = {
  uid: TNodeUid;
  parentUid: TNodeUid | null;

  displayName: string;

  isEntity: boolean;
  children: TNodeUid[];

  data: TNodeData;

  uniqueNodePath?: string;
};

export type TFileNodeData = TBasicNodeData & {
  path: string;

  kind: "file" | "directory";
  name: string;
  ext: string;

  orgContent: string;
  content: string;
  contentInApp?: string;

  changed: boolean;
};

export type TFileNode = TNode & {
  data: TFileNodeData;
};

export type TFileNodeTreeData = {
  [uid: TNodeUid]: TFileNode;
};
export interface FilerStats {
  dev: string;
  node: string;
  type: string;
  size: number;
  nlinks: number;
  atime: string;
  mtime: string;
  ctime: string;
  atimeMs: number;
  mtimeMs: number;
  ctimeMs: number;
  mode: number;
  uid: number;
  gid: number;
  name: string;
}
