import React, { useMemo } from "react";

import * as monaco from "monaco-editor";
import { loader } from "@monaco-editor/react";

import { useAppState } from "@_redux/useAppState";
import { Editor } from "@monaco-editor/react";

import useEditor from "@src/codeView/useEditor";
// import { getNodeUidByCodeSelection } from "./helpers";
// import { setEditingNodeUidInCodeView } from "@_redux/main/codeView";
// import { getFileExtension } from "../sidebarView/navigatorPanel/helpers";
// import { setShowCodePanel } from "@src/_redux/global";
// import { useMonacoEditor } from "@src/context/editor.context";

loader.config({ monaco });
export default function RnbwEditor() {
  const {
    // currentFileContent,
    // nodeUidPositions,

    // nodeTree,
    // validNodeTree,
    // nFocusedItem,

    // activePanel,

    // editingNodeUidInCodeView,
    // isCodeTyping,
    wordWrap,
  } = useAppState();

  // const { showCodePanel } = useSelector(
  //   (state: AppState) => state.global.panelsState,
  // );

  const {
    handleEditorDidMount,
    // handleOnChange,
    // handleKeyDown,
    theme,
    language,
    editorConfigs,
    currentFileUid,
    // codeSelection,
  } = useEditor();

  // editorInstance?.onKeyDown(handleKeyDown);

  // Function to update language based on file extension

  // Function to manage models (create or switch)

  return useMemo(() => {
    return (
      <Editor
        onMount={handleEditorDidMount}
        theme={theme}
        language={language}
        path={language}
        options={{
          ...editorConfigs,
          wordWrap: wordWrap ? "on" : ("off" as "on" | "off"),
        }}
      />
    );
  }, [
    handleEditorDidMount,
    theme,
    language,
    editorConfigs,
    wordWrap,
    currentFileUid,
  ]);
}
