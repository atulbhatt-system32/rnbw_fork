import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  collapseFileTreeNodes,
  expandFileTreeNodes,
  focusFileTreeNode,
  selectFileTreeNodes,
  setHoveredFileUid,
} from "./slice";

export const focusFileTreeNodeThunk = createAsyncThunk(
  "fileTree/focusFileTreeNode",
  async (uid: string, { dispatch }) => {
    dispatch(focusFileTreeNode(uid));
  },
);

export const expandFileTreeNodesThunk = createAsyncThunk(
  "fileTree/expandFileTreeNodes",
  async (uids: string[], { dispatch }) => {
    dispatch(expandFileTreeNodes(uids));
  },
);

export const collapseFileTreeNodesThunk = createAsyncThunk(
  "fileTree/collapseFileTreeNodes",
  async (uids: string[], { dispatch }) => {
    dispatch(collapseFileTreeNodes(uids));
  },
);

export const selectFileTreeNodesThunk = createAsyncThunk(
  "fileTree/selectFileTreeNodes",
  async (uids: string[], { dispatch }) => {
    dispatch(selectFileTreeNodes(uids));
  },
);

export const setHoveredFileUidThunk = createAsyncThunk(
  "fileTree/setHoveredFileUid",
  async (uid: string, { dispatch }) => {
    dispatch(setHoveredFileUid(uid));
  },
);
