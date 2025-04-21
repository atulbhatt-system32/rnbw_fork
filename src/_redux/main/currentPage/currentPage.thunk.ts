import { TNodeUid } from "@_api/index"; // Adjust import path as needed
import { createAsyncThunk } from "@reduxjs/toolkit";
import { AppDispatch, AppState, store } from "@src/_redux/store";
import { _writeIDBFile } from "@src/api/file/nohostApis";
import { RootNodeUid } from "@src/constants"; // Adjust import path as needed
import { getPreviewPath, markChangedFolders } from "@src/processor/helpers";
import htmlService from "@src/services/html.service";
import { TreeStructure } from "@src/types/html.types";
import { serialize } from "parse5";
import { setFileTreeNodes } from "../fileTree/slice";
import {
  addExpandedNodeUid,
  CurrentPageState,
  removeExpandedNodeUid,
  setCurrentPage,
  setCurrentPageNewNodeTree,
  setCurrentPagePreviewContent,
  setExpandedNodeUids,
  setFocusedNodeUid,
  setHoveredNodeUid,
  setInitialNodeIds,
  setIsEditingTextNode,
  setSelectedNodeUids,
} from "./currentPage.slice";

/**
 * Calculates the list of ancestor UIDs for a given node,
 * starting from the top-level node down to the direct parent.
 * @param targetUid The UID of the node to find ancestors for.
 * @param nodeTree The complete node tree structure.
 * @returns An array of ancestor UIDs, ordered from root to parent.
 */
export function getAncestorUids(
  targetUid: TNodeUid | undefined | null,
  nodeTree: TreeStructure,
): TNodeUid[] {
  const ancestors: TNodeUid[] = [];
  if (!targetUid || !nodeTree || !nodeTree[targetUid]) {
    return ancestors; // Return empty if target/tree is invalid
  }

  let currentUid: TNodeUid | undefined = nodeTree[targetUid]?.data?.parentId;

  while (currentUid && currentUid !== RootNodeUid && nodeTree[currentUid]) {
    // Add the parent to the beginning of the list to maintain root-down order
    ancestors.unshift(currentUid);

    // Move up to the next parent
    currentUid = nodeTree[currentUid]?.data?.parentId;
  }

  // Optionally add the root node itself if it wasn't added (e.g., if loop stopped at RootNodeUid)
  // Check if the top-level node should always be included (like 'html1')
  // Depending on your RootNodeUid structure, you might need to adjust slightly
  // For example, if 'html1' is the direct child of RootNodeUid, the loop might stop too early.
  // Let's assume the loop correctly includes the necessary top levels like 'html' and 'body'.

  return ancestors;
}

export const setCurrentPageNewNodeTreeThunk = createAsyncThunk(
  "currentPage/setCurrentPageNewNodeTree",
  async (
    {
      nodeTree,
      previewContent,
    }: {
      nodeTree: TreeStructure;
      previewContent: string;
    },
    { dispatch },
  ) => {
    dispatch(setCurrentPageNewNodeTree(nodeTree));

    //find uids of html and body node from the nodeTree to set initial expanded nodes
    const initialExpandedNodes =
      htmlService.getInitialExpandedNodesFromNodeTree(nodeTree);
    dispatch(setExpandedNodeUids(initialExpandedNodes));

    dispatch(setCurrentPagePreviewContent(previewContent));

    // if the initial expanded nodes include body, select the first child of body
    // otherwise, select the body node
    let bodyFound = false;
    for (const node of initialExpandedNodes) {
      if (node.toLowerCase().startsWith("body")) {
        if (nodeTree[node].children.length > 0) {
          const firstChild = nodeTree[node].children[0];
          dispatch(setSelectedNodeUids([firstChild]));
        } else {
          dispatch(setSelectedNodeUids([node]));
        }
        bodyFound = true;
        break; // Break the loop once body is found
      }
    }

    // If body wasn't found, you might want to select a default node
    if (!bodyFound && initialExpandedNodes.length > 0) {
      dispatch(setSelectedNodeUids([initialExpandedNodes[0]]));
    }

    htmlService.scrollToElement(initialExpandedNodes.at(-1) as string);
  },
);

export const setSelectedNodeUidsThunk = createAsyncThunk(
  "currentPage/setSelectedNodeUids",
  async (nodeUids: string[], { dispatch }) => {
    dispatch(setSelectedNodeUids(nodeUids));
    htmlService.markSelectedElements(nodeUids);
    htmlService.scrollToElement(nodeUids.at(-1) as string);
  },
);

export const setHoveredNodeUidThunk = createAsyncThunk(
  "currentPage/setHoveredNodeUid",
  async (nodeUid: string, { dispatch }) => {
    dispatch(setHoveredNodeUid(nodeUid));
    htmlService.markHoveredElement(nodeUid);
  },
);

export const setFocusedNodeUidThunk = createAsyncThunk(
  "currentPage/setFocusedNodeUid",
  async (nodeUid: string, { dispatch }) => {
    dispatch(setFocusedNodeUid(nodeUid));
  },
);

export const setExpandedNodeUidsThunk = createAsyncThunk(
  "currentPage/setExpandedNodeUids",
  async (nodeUids: string[], { dispatch }) => {
    dispatch(setExpandedNodeUids(nodeUids));
  },
);

export const addExpandedNodeUidThunk = createAsyncThunk(
  "currentPage/addExpandedNodeUid",
  async (nodeUid: string, { dispatch }) => {
    dispatch(addExpandedNodeUid(nodeUid));
  },
);

export const removeExpandedNodeUidThunk = createAsyncThunk(
  "currentPage/removeExpandedNodeUid",
  async (nodeUid: string, { dispatch }) => {
    dispatch(removeExpandedNodeUid(nodeUid));
  },
);

export const setCurrentPageThunk = createAsyncThunk(
  "currentPage/setCurrentPage",
  async (currentPage: Partial<CurrentPageState>, { dispatch }) => {
    const currentFileUid = currentPage.uid;
    const currentFileContent = currentPage.content;
    if (!currentFileUid || currentFileContent == null) {
      return;
    }
    const fileTree = store.getState().main.file.fileTree;
    const file = fileTree[currentFileUid];
    const structuredCloneFile = structuredClone(file);
    const fileData = structuredCloneFile.data;
    const orginalContent = fileData.content;
    const ext = fileData.ext;

    // bcuz currentFileContent can be empty string
    if (currentFileContent !== null) {
      if (ext === "html" && currentFileContent !== "") {
        const document = htmlService.parseHtml(currentFileContent);
        const { complexNodeTree, document: previewDocument } =
          htmlService.createNodeTree(document);
        if (previewDocument) {
          const previewContent = serialize(previewDocument);

          if (structuredCloneFile) {
            fileData.contentInApp = previewContent;
          }
        }
        const previewPath = getPreviewPath(fileTree, file);
        await _writeIDBFile(previewPath, fileData.contentInApp as string);
        dispatch(
          setCurrentPage({
            ...currentPage,
            content: currentFileContent,
            newNodeTree: complexNodeTree,
            designViewState: {
              previewPath,
              previewUrl: `rnbw${previewPath}`,
              previewContent: fileData.contentInApp || "",
              uid: currentFileUid,
            },
            uid: currentFileUid,
          }),
        );
        // set the initial node IDs
        dispatch(setInitialNodeIds());
        if (currentPage.updateType === "type") {
          htmlService.updateIframe(fileData.contentInApp as string);
        }
      } else {
        dispatch(
          setCurrentPage({
            ...currentPage,
            content: currentFileContent,
            uid: currentFileUid,
          }),
        );
        fileData.contentInApp = "";
      }
      fileData.content = currentFileContent;
      fileData.changed = orginalContent !== currentFileContent;
      if (file.parentUid) {
        markChangedFolders(fileTree, file, dispatch, fileData.changed);
      }
      dispatch(setFileTreeNodes([structuredCloneFile]));
    }
  },
);

// --- New Thunk for Expanding Ancestors ---
export const expandAncestorsOfNodeThunk = createAsyncThunk(
  "currentPage/expandAncestorsOfNode", // Unique action type name
  async (targetUid: string, { dispatch, getState }) => {
    if (!targetUid) {
      console.warn("expandAncestorsOfNodeThunk: No targetUid provided.");
      return;
    }

    const state = getState() as AppState;
    const nodeTree = state.main.currentPage.newNodeTree;

    if (!nodeTree) {
      console.error("expandAncestorsOfNodeThunk: nodeTree not found in state.");
      return;
    }

    // Calculate ancestor UIDs using the existing helper
    const ancestorUids = getAncestorUids(targetUid, nodeTree);

    // Dispatch the action to update the expanded nodes state
    dispatch(setExpandedNodeUids(ancestorUids));
  },
);
// --- End New Thunk ---

export const setIsEditingTextNodeThunk = (isEditing: boolean) => {
  return (dispatch: AppDispatch) => {
    dispatch(setIsEditingTextNode(isEditing));
  };
};
