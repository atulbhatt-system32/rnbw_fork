import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { THtmlNodeTreeData, TNodeTreeData } from "@src/api";

interface CurrentPageState {
  uid: string;
  content: string;
  nodeTree: TNodeTreeData;
  previewPath: string;
  previewUrl: string | null;
  previewContent: string;
}

const initialState: CurrentPageState = {
  uid: "",
  content: "",
  nodeTree: {},
  previewPath: "",
  previewUrl: null,
  previewContent: "",
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
      state.previewPath = action.payload;
    },
    setCurrentPagePreviewUrl(state, action: PayloadAction<string>) {
      state.previewUrl = action.payload;
    },
    setCurrentPagePreviewContent(state, action: PayloadAction<string>) {
      state.previewContent = action.payload;
    },
    setCurrentPageUid(state, action: PayloadAction<string>) {
      state.uid = action.payload;
    },
    resetCurrentPage(state) {
      state.uid = "";
      state.content = "";
      state.nodeTree = {};
      state.previewPath = "";
      state.previewUrl = null;
    },
  },
});

export const { setCurrentPage, resetCurrentPage, setCurrentPagePreviewUrl } =
  currentPageSlice.actions;
export default currentPageSlice.reducer;
