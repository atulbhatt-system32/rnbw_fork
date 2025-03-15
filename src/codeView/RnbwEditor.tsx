import React, { useEffect, useMemo } from "react";

import * as monaco from "monaco-editor";
import { loader } from "@monaco-editor/react";
import { useDispatch, useSelector } from "react-redux";

// import { RootNodeUid } from "@src/constants";
import {
  // getDecorationUid,
  // isUidDecoration,
  // setDecorationUid,
  TFileNodeData,
  // TNodeUid,
} from "@_api/index";

// import { setSelectedNodeUids } from "@_redux/main/nodeTree";
import { useAppState } from "@_redux/useAppState";
import { Editor } from "@monaco-editor/react";

import { useEditor } from "./hooks";
// import { getNodeUidByCodeSelection } from "./helpers";
// import { setEditingNodeUidInCodeView } from "@_redux/main/codeView";
// import { getFileExtension } from "../sidebarView/navigatorPanel/helpers";
import { AppState } from "@src/_redux/store";
// import { setShowCodePanel } from "@src/_redux/global";
import { setEditorModels } from "@src/_redux/main/editorSlice";
loader.config({ monaco });
export default function RnbwEditor() {
  const dispatch = useDispatch();
  const {
    fileTree,
    currentFileUid,
    // currentFileContent,
    // nodeUidPositions,

    // nodeTree,
    // validNodeTree,
    // nFocusedItem,

    // activePanel,

    // editingNodeUidInCodeView,
    // isCodeTyping,
    wordWrap,
    codeErrors,
  } = useAppState();

  const currentFileContent = useSelector(
    (state: AppState) => state.main.currentPage.content,
  );

  const { editorInstance, editorModels } = useSelector(
    (state: AppState) => state.main.editor,
  );

  // const { showCodePanel } = useSelector(
  //   (state: AppState) => state.global.panelsState,
  // );

  const {
    handleEditorDidMount,
    handleOnChange,
    // handleKeyDown,
    theme,
    language,
    updateLanguage,
    editorConfigs,
    // codeSelection,
  } = useEditor();

  // editorInstance?.onKeyDown(handleKeyDown);

  // language sync
  useEffect(() => {
    const file = fileTree[currentFileUid];
    if (!file) return;

    const fileData = file.data as TFileNodeData;
    const extension = fileData.ext;
    extension && updateLanguage(extension);

    // Create or switch model
    const modelId = extension; // Use file UID as model ID

    if (!editorModels[modelId]) {
      const newModel = monaco.editor.createModel(currentFileContent, extension);
      dispatch(setEditorModels({ ...editorModels, [modelId]: newModel }));
    } else {
      const existingModel = editorModels[modelId];
      existingModel.setValue(currentFileContent); // Update existing model content
    }

    editorInstance?.setModel(editorModels[modelId]); // Set the current model to the editor
  }, [fileTree, currentFileUid, currentFileContent]);

  // scroll to top on file change
  // useEffect(() => {
  //   editorInstance?.setScrollTop(0);
  // }, [currentFileUid]);

  // focusedItem -> code select
  // const focusedItemRef = useRef<TNodeUid>("");

  // const hightlightFocusedNodeSourceCode = useCallback(() => {
  //   if (!editorInstance) return;
  //   if (activePanel === "code") return;

  //   const node = validNodeTree[nFocusedItem];
  //   const sourceCodeLocation = node.data.sourceCodeLocation;
  //   if (!sourceCodeLocation) return;

  //   const {
  //     startLine: startLineNumber,
  //     startCol: startColumn,
  //     endCol: endColumn,
  //     endLine: endLineNumber,
  //   } = sourceCodeLocation;

  //   editorInstance.setSelection({
  //     startLineNumber,
  //     startColumn,
  //     endLineNumber,
  //     endColumn,
  //   });
  //   editorInstance.revealRangeInCenter(
  //     {
  //       startLineNumber,
  //       startColumn,
  //       endLineNumber,
  //       endColumn,
  //     },
  //     1,
  //   );
  // }, [validNodeTree, nFocusedItem, activePanel]);

  // useEffect(() => {
  //   if (isCodeTyping || activePanel === "code") return;

  //   if (!editorInstance) return;

  //   if (focusedItemRef.current === nFocusedItem) {
  //     if (!codeSelection) return;

  //     const node = validNodeTree[nFocusedItem];
  //     const sourceCodeLocation = node.data.sourceCodeLocation;

  //     if (!sourceCodeLocation) return;
  //     const {
  //       startLine: startLineNumber,
  //       startCol: startColumn,
  //       endCol: endColumn,
  //       endLine: endLineNumber,
  //     } = sourceCodeLocation;

  //     editorInstance.setSelection({
  //       startLineNumber,
  //       startColumn,
  //       endLineNumber,
  //       endColumn,
  //     });
  //     editorInstance.revealRangeInCenter(
  //       {
  //         startLineNumber: codeSelection?.startLineNumber,
  //         startColumn: codeSelection?.startColumn,
  //         endLineNumber: codeSelection?.endLineNumber,
  //         endColumn: codeSelection?.endColumn,
  //       },
  //       1,
  //     );
  //     return;
  //   }
  //   focusedItemRef.current = nFocusedItem;

  //   // skip typing in code-view
  //   if (editingNodeUidInCodeView === nFocusedItem) {
  //     focusedItemRef.current = nFocusedItem;
  //     dispatch(setEditingNodeUidInCodeView(""));
  //     return;
  //   }

  //   if (nFocusedItem === RootNodeUid || !validNodeTree[nFocusedItem]) {
  //     editorInstance.setSelection({
  //       startLineNumber: 1,
  //       startColumn: 1,
  //       endLineNumber: 1,
  //       endColumn: 1,
  //     });
  //   } else {
  //     hightlightFocusedNodeSourceCode();
  //   }
  // }, [nFocusedItem]);

  // useEffect(() => {
  //   if (activePanel === "code" || isCodeTyping || nFocusedItem === "") return;

  //   if (!editorInstance) return;
  //   const node = validNodeTree[nFocusedItem];
  //   if (!node) return;
  //   const sourceCodeLocation = node.data.sourceCodeLocation;
  //   if (!sourceCodeLocation) return;
  //   // skip typing in code-view
  //   if (editingNodeUidInCodeView === nFocusedItem) {
  //     focusedItemRef.current = nFocusedItem;
  //     dispatch(setEditingNodeUidInCodeView(""));
  //     return;
  //   }
  //   const {
  //     startLine: startLineNumber,
  //     startCol: startColumn,
  //     endCol: endColumn,
  //     endLine: endLineNumber,
  //   } = sourceCodeLocation;
  //   editorInstance.setSelection({
  //     startLineNumber,
  //     startColumn,
  //     endLineNumber,
  //     endColumn,
  //   });
  // }, [nodeTree]);

  // code select -> selectedUids
  // useEffect(() => {
  //   if (!codeSelection || isCodeTyping) return;

  //   const file = fileTree[currentFileUid];
  //   if (!file) return;

  //   const ext = file.data.ext;
  //   if (ext !== "html") return;

  //   if (!validNodeTree[RootNodeUid]) return;

  //   const focusedNodeUid = getNodeUidByCodeSelection(
  //     codeSelection,
  //     nodeTree,
  //     validNodeTree,
  //   );
  //   if (focusedNodeUid && focusedItemRef.current !== focusedNodeUid) {
  //     focusedItemRef.current = focusedNodeUid;
  //     focusedNodeUid && dispatch(setSelectedNodeUids([focusedNodeUid]));
  //   }
  // }, [codeSelection]);

  // show codeView when opening a file without design
  // useEffect(() => {
  //   const fileNode = fileTree[currentFileUid];
  //   if (!fileNode || showCodePanel) return;

  //   const isCurrentFileHtml = getFileExtension(fileNode) === "html";
  //   !isCurrentFileHtml && dispatch(setShowCodePanel(true));
  // }, [currentFileUid]);

  // Sync value (note: this has to come before decorations)
  // useEffect(() => {
  //   const editorModel = editorInstance?.getModel();
  //   if (!editorModel) return;

  //   // Ensure the model's value is updated with the current file content
  //   if (editorModel.getValue() !== currentFileContent) {
  //     editorModel.setValue(currentFileContent);
  //   }
  // }, [currentFileContent, editorInstance]);

  // Sync decorations to track node positions
  // useEffect(() => {
  //   const editorModel = editorInstance?.getModel();
  //   if (!editorModel) return;

  //   const oldDecorations: string[] = [];
  //   const newDecorations: monaco.editor.IModelDeltaDecoration[] = [];
  //   const allDecorations = editorModel.getAllDecorations();
  //   const stickiness = monaco.editor.TrackedRangeStickiness;
  //   nodeUidPositions.forEach((position, uid) => {
  //     // Check if the editor has an existing decoration
  //     const id = position.decorationId;
  //     if (!(id && editorModel.getDecorationOptions(id))) {
  //       // If not, one needs to be created
  //       const { startLine, startCol } = position.location;
  //       const newDecoration: monaco.editor.IModelDeltaDecoration = {
  //         range: new monaco.Range(startLine, startCol, startLine, startCol + 1),
  //         // This is important to ensure it tracks properly
  //         options: { stickiness: stickiness.NeverGrowsWhenTypingAtEdges },
  //       };
  //       // These are useful for debug purposes but not for production
  //       // newDecoration.options.hoverMessage = { value: uid };
  //       // newDecoration.options.inlineClassName = "uid-decoration";
  //       setDecorationUid(newDecoration, uid);
  //       newDecorations.push(newDecoration);
  //     }
  //   });
  //   allDecorations.forEach((decoration) => {
  //     // Check if this decoration is required
  //     if (isUidDecoration(decoration)) {
  //       const uid = getDecorationUid(decoration);
  //       if (!nodeUidPositions.has(uid)) {
  //         // If not, it can be deleted
  //         oldDecorations.push(decoration.id);
  //       }
  //     }
  //   });
  //   // oldDecorations are removed, neDecorations are added
  //   editorModel.deltaDecorations(oldDecorations, newDecorations);
  // }, [nodeUidPositions]);

  useEffect(() => {
    console.log("currentFileContent", currentFileContent);
  }, [currentFileContent]);

  return useMemo(() => {
    return (
      <Editor
        onMount={handleEditorDidMount}
        theme={theme}
        language={language}
        path={language}
        // value={currentFileContent}
        // onChange={(value) => handleOnChange(value, currentFileUid)}
        options={{
          ...editorConfigs,
          wordWrap: wordWrap ? "on" : ("off" as "on" | "off"),
        }}
      />
    );
  }, [
    handleEditorDidMount,
    handleOnChange,

    theme,
    language,
    currentFileContent,
    editorConfigs,
    codeErrors,
  ]);
}
