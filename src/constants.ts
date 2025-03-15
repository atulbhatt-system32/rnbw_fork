export const StageNodeIdAttr = "data-rnbw-stage-node-id";
export const PreserveRnbwNode = "data-rnbw-preserve-node";
export const DataSequencedUid = "data-sequenced-uid";
export const ValidStageNodeUid = "data-rnbw-stage-valid-uid";
export const RnbwEditableNodeAttr = "rnbwdev-rnbw-editable";
export const RootNodeUid = "ROOT";
export const DefaultProjectPath = "/untitled";
export const StagePreviewPathPrefix = "rnbw-stage-preview-";
export const CodeViewSyncDelay = 100;
export const CodeViewSyncDelay_Long = 1 * 1000;
export const AutoSaveDelay = 5000;

export const ParsableFileTypes: { [fileType: string]: true } = {
  html: true,
  css: true,
  js: true,
  txt: true,
  json: true,
  md: true,
  xml: true,
  svg: true,
};

export const RenderableFileTypes: { [fileType: string]: true } = {
  html: true,
};

export const AddActionPrefix = "AddAction";
export const AddFileActionPrefix = `${AddActionPrefix}-File`;
export const TmpFileNodeUidWhenAddNew = "tmp:node:uid";
export const AddNodeActionPrefix = `${AddActionPrefix}-Node`;

export const RenameActionPrefix = "RenameAction";
export const RenameFileActionPrefix = `${RenameActionPrefix}-File`;
export const RenameNodeActionPrefix = `${RenameActionPrefix}-Node`;

export const DefaultTabSize = 2;
export const RecentProjectCount = 10;
export const ShortDelay = 50;
export const NodePathSplitter = "?";
export const FileChangeAlertMessage = `Your changes will be lost if you don't save them. Are you sure you want to continue without saving?`;

export const DargItemImage = new Image();
DargItemImage.src =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=";

export const RainbowAppName = "rnbw";
export const LogAllow = true;
export const BrowserUnsupportedMessage = `Browser is unsupported. rnbw works in the latest versions of Google Chrome and Microsoft Edge.`;
