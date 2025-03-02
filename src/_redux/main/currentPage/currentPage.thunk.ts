import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  setSelectedNodeUids,
  setFocusedNodeUid,
  setExpandedNodeUids,
  addExpandedNodeUid,
  removeExpandedNodeUid,
  setCurrentPageNewNodeTree,
  setCurrentPagePreviewContent,
} from "./currentPage.slice";
import { TreeStructure } from "@src/types/html.types";

export const setCurrentPageNewNodeTreeThunk = createAsyncThunk(
  "currentPage/setCurrentPageNewNodeTree",
  async (
    {
      nodeTree,
      previewContent,
    }: { nodeTree: TreeStructure; previewContent: string },
    { dispatch },
  ) => {
    dispatch(setCurrentPageNewNodeTree(nodeTree));
    dispatch(setCurrentPagePreviewContent(previewContent));
  },
);

export const setSelectedNodeUidsThunk = createAsyncThunk(
  "currentPage/setSelectedNodeUids",
  async (nodeUids: string[], { dispatch }) => {
    dispatch(setSelectedNodeUids(nodeUids));
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
