import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  setSelectedNodeUids,
  setFocusedNodeUid,
  setExpandedNodeUids,
  addExpandedNodeUid,
  removeExpandedNodeUid,
  setCurrentPageNewNodeTree,
  setCurrentPagePreviewContent,
  setHoveredNodeUid,
  setCurrentPage,
  CurrentPageState,
} from "./currentPage.slice";
import { TreeStructure } from "@src/types/html.types";
import htmlService from "@src/services/html.service";
import { serialize } from "parse5";
import { store } from "@src/_redux/store";
import { getPreviewPath, markChangedFolders } from "@src/processor/helpers";
import { setFileTreeNodes } from "../fileTree/slice";
import { _writeIDBFile } from "@src/api/file/nohostApis";

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
    if (!currentFileUid || !currentFileContent) {
      return;
    }

    const fileTree = store.getState().main.file.fileTree;
    const file = fileTree[currentFileUid];
    const structuredCloneFile = structuredClone(file);
    const fileData = structuredCloneFile.data;
    const orginalContent = fileData.content;
    const ext = fileData.ext;

    if (currentFileContent) {
      if (ext === "html") {
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
            },
            uid: currentFileUid,
          }),
        );
        if (currentPage.updateType === "type") {
          htmlService.updateIframe(currentFileContent);
        }
      } else {
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
