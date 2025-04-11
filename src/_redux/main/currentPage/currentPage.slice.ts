import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { THtmlNodeTreeData, TNodeTreeData } from "@src/api";
import { TreeStructure } from "@src/types/html.types";

export interface CurrentPageState {
  uid: string;
  content: string;
  extension: string;
  nodeTree: TNodeTreeData;
  newNodeTree: TreeStructure;
  updateType: "load" | "type" | "morph";
  designViewState: {
    previewPath: string;
    previewUrl: string | null;
    previewContent: string;
    uid: string;
  };
  nodeTreeViewState: {
    selectedNodeUids: string[];
    focusedNodeUid: string;
    expandedNodeUids: string[];
    hoveredNodeUid: string;
  };
}

interface ContentUpdatePayload {
  content: string;
  previewContent: string;
  nodeTree: TNodeTreeData;
}

const initialState: CurrentPageState = {
  uid: "",
  content: "",
  extension: "",
  nodeTree: {},
  designViewState: {
    previewPath: "",
    previewUrl: null,
    previewContent: "",
    uid: "",
  },
  updateType: "load",
  newNodeTree: {},
  nodeTreeViewState: {
    selectedNodeUids: [],
    focusedNodeUid: "",
    expandedNodeUids: [],
    hoveredNodeUid: "",
  },
};

const currentPageSlice = createSlice({
  name: "currentPage",
  initialState,
  reducers: {
    setCurrentPage(state, action: PayloadAction<Partial<CurrentPageState>>) {
      return {
        ...state,
        ...action.payload,
      };
    },
    setCurrentPageContent(state, action: PayloadAction<string>) {
      state.content = action.payload;
    },
    setCurrentPageNodeTree(state, action: PayloadAction<THtmlNodeTreeData>) {
      state.nodeTree = action.payload;
    },
    setCurrentPagePreviewPath(state, action: PayloadAction<string>) {
      state.designViewState.previewPath = action.payload;
    },
    setCurrentPagePreviewUrl(state, action: PayloadAction<string>) {
      state.designViewState.previewUrl = action.payload;
    },
    setCurrentPagePreviewContent(state, action: PayloadAction<string>) {
      state.designViewState.previewContent = action.payload;
    },
    setCurrentPageUid(state, action: PayloadAction<string>) {
      state.uid = action.payload;
    },
    setCurrentPageExtension(state, action: PayloadAction<string>) {
      state.extension = action.payload;
    },
    morphCurrentPage(state, action: PayloadAction<ContentUpdatePayload>) {
      return {
        ...state,
        ...action.payload,
        updateType: "morph",
      };
    },
    updateCurrentPageByTyping(
      state,
      action: PayloadAction<ContentUpdatePayload>,
    ) {
      return {
        ...state,
        ...action.payload,
        updateType: "type",
      };
    },
    setCurrentPageNewNodeTree(state, action: PayloadAction<TreeStructure>) {
      state.newNodeTree = action.payload;
    },
    resetCurrentPage() {
      return initialState;
    },
    setSelectedNodeUids(state, action: PayloadAction<string[]>) {
      state.nodeTreeViewState.selectedNodeUids = action.payload;
    },
    setFocusedNodeUid(state, action: PayloadAction<string>) {
      state.nodeTreeViewState.focusedNodeUid = action.payload;
    },
    setExpandedNodeUids(state, action: PayloadAction<string[]>) {
      state.nodeTreeViewState.expandedNodeUids = action.payload;
    },
    addExpandedNodeUid(state, action: PayloadAction<string>) {
      state.nodeTreeViewState.expandedNodeUids.push(action.payload);
    },
    removeExpandedNodeUid(state, action: PayloadAction<string>) {
      state.nodeTreeViewState.expandedNodeUids =
        state.nodeTreeViewState.expandedNodeUids.filter(
          (uid) => uid !== action.payload,
        );
    },
    setHoveredNodeUid(state, action: PayloadAction<string>) {
      state.nodeTreeViewState.hoveredNodeUid = action.payload;
    },
  },
});

export const {
  setCurrentPage,
  resetCurrentPage,
  setCurrentPageContent,
  setCurrentPagePreviewUrl,
  setCurrentPagePreviewContent,
  morphCurrentPage,
  updateCurrentPageByTyping,
  setCurrentPageNewNodeTree,
  setHoveredNodeUid,
  setSelectedNodeUids,
  setFocusedNodeUid,
  setExpandedNodeUids,
  addExpandedNodeUid,
  removeExpandedNodeUid,
  setCurrentPageExtension,
} = currentPageSlice.actions;
export default currentPageSlice.reducer;
