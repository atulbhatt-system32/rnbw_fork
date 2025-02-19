import { TNodeTreeData, TNodeUid } from "@_api/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { TUpdateTreeViewStatePayload } from "../types";
import { TNodeTreeReducerState } from "./types";
import { TCodeSelection } from "@src/codeView";
import { getValidNodeTree } from "@src/processor/helpers";
import { ParserError } from "parse5";

const nodeTreeReducerInitialState: TNodeTreeReducerState = {
  nodeTree: {},
  validNodeTree: {},

  needToSelectNodePaths: null,
  needToSelectCode: null,

  nodeTreeViewState: {
    focusedItem: "",
    expandedItemsObj: {},
    selectedItemsObj: {},
  },
  hoveredNodeUid: "",
  copiedNodeDisplayName: [],
  parserErrors: [],
};
const nodeTreeSlice = createSlice({
  name: "nodeTree",
  initialState: nodeTreeReducerInitialState,
  reducers: {
    setNodeTree(state, actions: PayloadAction<TNodeTreeData>) {
      const nodeTree = actions.payload;
      state.nodeTree = nodeTree;
      state.validNodeTree = getValidNodeTree(nodeTree);
    },

    setNeedToSelectNodePaths(state, action: PayloadAction<string[] | null>) {
      const needToSelectNodePaths = action.payload;
      state.needToSelectNodePaths = needToSelectNodePaths;
    },
    setNeedToSelectCode(state, action: PayloadAction<TCodeSelection | null>) {
      const needToSelectCode = action.payload;
      state.needToSelectCode = needToSelectCode;
    },

    focusNodeTreeNode(state, action: PayloadAction<TNodeUid>) {
      const focusedItem = action.payload;
      state.nodeTreeViewState.focusedItem = focusedItem;
    },
    setExpandedNodeTreeNodes(state, action: PayloadAction<TNodeUid[]>) {
      const expandedItems = action.payload;
      state.nodeTreeViewState.expandedItemsObj = {};
      for (const uid of expandedItems) {
        state.nodeTreeViewState.expandedItemsObj[uid] = true;
      }
    },
    expandNodeTreeNodes(state, action: PayloadAction<TNodeUid[]>) {
      const uids = action.payload;
      for (const uid of uids) {
        state.nodeTreeViewState.expandedItemsObj[uid] = true;
      }
    },
    collapseNodeTreeNodes(state, action: PayloadAction<TNodeUid[]>) {
      const uids = action.payload;
      for (const uid of uids) {
        delete state.nodeTreeViewState.expandedItemsObj[uid];
      }
    },
    selectNodeTreeNodes(state, action: PayloadAction<TNodeUid[]>) {
      const selectedItems = action.payload;
      state.nodeTreeViewState.selectedItemsObj = {};
      for (const uid of selectedItems) {
        state.nodeTreeViewState.selectedItemsObj[uid] = true;
      }
    },
    updateNodeTreeTreeViewState(
      state,
      action: PayloadAction<TUpdateTreeViewStatePayload>,
    ) {
      const { deletedUids = [], convertedUids = [] } = action.payload;
      deletedUids.map((uid) => {
        if (state.nodeTreeViewState.focusedItem === uid) {
          state.nodeTreeViewState.focusedItem = "";
        }
        delete state.nodeTreeViewState.expandedItemsObj[uid];
        delete state.nodeTreeViewState.selectedItemsObj[uid];
      });

      let f_uid: TNodeUid = "";
      const e_deletedUids: TNodeUid[] = [],
        e_addedUids: TNodeUid[] = [];
      const s_deletedUids: TNodeUid[] = [],
        s_addedUids: TNodeUid[] = [];

      for (const [prevUid, curUid] of convertedUids) {
        if (state.nodeTreeViewState.focusedItem === prevUid) {
          f_uid = curUid;
        }
        if (state.nodeTreeViewState.expandedItemsObj[prevUid]) {
          e_deletedUids.push(prevUid);
          e_addedUids.push(curUid);
        }
        if (state.nodeTreeViewState.selectedItemsObj[prevUid]) {
          s_deletedUids.push(prevUid);
          s_addedUids.push(curUid);
        }
      }

      state.nodeTreeViewState.focusedItem =
        f_uid !== "" ? f_uid : state.nodeTreeViewState.focusedItem;
      e_deletedUids.map((_deletedUid) => {
        delete state.nodeTreeViewState.expandedItemsObj[_deletedUid];
      });
      e_addedUids.map((_addedUid) => {
        state.nodeTreeViewState.expandedItemsObj[_addedUid] = true;
      });
      s_deletedUids.map((_deletedUid) => {
        delete state.nodeTreeViewState.selectedItemsObj[_deletedUid];
      });
      s_addedUids.map((_addedUid) => {
        state.nodeTreeViewState.selectedItemsObj[_addedUid] = true;
      });
    },
    setHoveredNodeUid(state, action: PayloadAction<TNodeUid>) {
      const hoveredNodeUid = action.payload;
      state.hoveredNodeUid = hoveredNodeUid;
    },
    clearNodeTreeViewState(state) {
      state.nodeTreeViewState = nodeTreeReducerInitialState.nodeTreeViewState;
    },
    setCopiedNodeDisplayName(state, action: PayloadAction<string[]>) {
      const copiedNodeDisplayName = action.payload;
      state.copiedNodeDisplayName = copiedNodeDisplayName;
    },
    addParserError(state, action: PayloadAction<ParserError>) {
      const parserError = action.payload;
      state.parserErrors.push(parserError);
    },
    removeParserError(state, action: PayloadAction<ParserError>) {
      const parserError = action.payload;
      state.parserErrors = state.parserErrors.filter(
        (error) => error !== parserError,
      );
    },
    clearParserErrors(state) {
      state.parserErrors = [];
    },
  },
});
export const {
  setNodeTree,

  setNeedToSelectNodePaths,
  setNeedToSelectCode,

  focusNodeTreeNode,
  setExpandedNodeTreeNodes,
  expandNodeTreeNodes,
  collapseNodeTreeNodes,
  selectNodeTreeNodes,
  updateNodeTreeTreeViewState,
  setHoveredNodeUid,
  clearNodeTreeViewState,
  setCopiedNodeDisplayName,
  addParserError,
  removeParserError,
  clearParserErrors,
} = nodeTreeSlice.actions;
export const NodeTreeReducer = nodeTreeSlice.reducer;
