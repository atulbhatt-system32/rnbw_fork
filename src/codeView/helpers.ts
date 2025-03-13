import { TTheme } from "@src/types";
import { getSystemTheme } from "../rnbw";
import { TCodeSelection } from "./types";
import { TNodeTreeData, TNodeUid } from "@_api/types";
import { getSubNodeUidsByBfs } from "@_api/helpers";
import { RootNodeUid } from "@src/constants";

export const getLanguageFromExtension = (extension: string) => {
  const extensionMap: { [key: string]: string } = {
    html: "html",
    js: "javascript",
    md: "markdown",
    css: "css",
  };
  return extensionMap[extension] || "plaintext";
};

export const getCodeViewTheme = (theme: TTheme) => {
  let _theme = theme;
  if (theme === "System") {
    _theme = getSystemTheme();
  }

  if (_theme === "Dark") {
    return "vs-dark";
  } else if (_theme === "Light") {
    return "light";
  }
};

export const getNodeUidByCodeSelection = (
  selection: TCodeSelection,
  nodeTree: TNodeTreeData,
  validNodeTree: TNodeTreeData,
): TNodeUid | null => {
  let focusedItem: TNodeUid | null = null;
  if (selection) {
    const uids = getSubNodeUidsByBfs(RootNodeUid, nodeTree);
    uids.reverse();
    for (const uid of uids) {
      const node = nodeTree[uid];
      const nodeData = node.data;
      const sourceCodeLocation = nodeData.sourceCodeLocation;
      if (!sourceCodeLocation) continue;

      const {
        startLine: startLineNumber,
        startCol: startColumn,
        endCol: endColumn,
        endLine: endLineNumber,
      } = sourceCodeLocation;

      const containFront =
        selection.startLineNumber === startLineNumber
          ? selection.startColumn > startColumn
          : selection.startLineNumber > startLineNumber;
      const containBack =
        selection.endLineNumber === endLineNumber
          ? selection.endColumn <= endColumn
          : selection.endLineNumber < endLineNumber;

      if (containFront && containBack) {
        focusedItem = nodeData.valid
          ? uid
          : validNodeTree[node.parentUid!].children.length
            ? null
            : node.parentUid;
        break;
      }
    }
  }
  return focusedItem;
};
