import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as monaco from "monaco-editor";
import { enableMapSet } from "immer";

enableMapSet();

interface EditorState {
  editorInstance: monaco.editor.IStandaloneCodeEditor | null;
  editorModels: Record<string, monaco.editor.ITextModel>;
  isEditorReady: boolean;
}

const initialState: EditorState = {
  editorInstance: null,
  editorModels: {},
  isEditorReady: false,
};

const editorSlice = createSlice({
  name: "editor",
  initialState,
  reducers: {
    setEditorInstance(
      state,
      action: PayloadAction<monaco.editor.IStandaloneCodeEditor>,
    ) {
      state.editorInstance = action.payload;
      state.isEditorReady = true;
    },
    setEditorModels(
      state,
      action: PayloadAction<Record<string, monaco.editor.ITextModel>>,
    ) {
      state.editorModels = action.payload;
    },
  },
});

export const { setEditorInstance, setEditorModels } = editorSlice.actions;
export default editorSlice.reducer;
