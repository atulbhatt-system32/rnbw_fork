import React, { useEffect, useMemo } from "react";

import * as monaco from "monaco-editor";
import { loader } from "@monaco-editor/react";
import { useSelector } from "react-redux";

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
import { useMonacoEditor } from "@src/context/editor.context";
loader.config({ monaco });
export default function RnbwEditor() {
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
  const { editorInstance, editorModels, setEditorModels } = useMonacoEditor();
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
    if (!editorInstance) return;

    const file = fileTree[currentFileUid];
    if (!file) return;

    const fileData = file.data as TFileNodeData;
    const extension = fileData.ext;
    extension && updateLanguage(extension);
  }, [fileTree, currentFileUid, editorInstance, updateLanguage]);

  // Model management - completely separated from content updates
  useEffect(() => {
    if (!editorInstance || !currentFileUid) return;

    const file = fileTree[currentFileUid];
    if (!file) return;

    const fileData = file.data as TFileNodeData;
    const extension = fileData.ext;
    if (!extension) return;

    // We use the file UID as model ID to ensure uniqueness
    const modelId = currentFileUid;

    try {
      console.log("Switching to model for file:", modelId);

      // Save scroll position first
      const scrollTop = editorInstance.getScrollTop();
      const viewState = editorInstance.saveViewState();

      // Check if we already have a model for this file
      if (editorModels[modelId]) {
        console.log("Using existing model for:", modelId);
        // Use existing model - don't update content here
        editorInstance.setModel(editorModels[modelId]);
      } else {
        console.log("Creating new model for:", modelId);
        // Create a new model with initial content
        const newModel = monaco.editor.createModel(
          currentFileContent || "",
          extension,
        );
        // Store the model in our context
        setEditorModels((prev) => ({ ...prev, [modelId]: newModel }));
        // Set the model to the editor
        editorInstance.setModel(newModel);
      }

      // Restore view state if available
      if (viewState) {
        editorInstance.restoreViewState(viewState);
        editorInstance.setScrollTop(scrollTop);
      }
    } catch (error) {
      console.error("Error switching models:", error);
    }
  }, [
    currentFileUid,
    fileTree,
    editorInstance,
    editorModels,
    setEditorModels,
    currentFileContent,
  ]);

  // Extra protection: ensure model has content on initial load
  useEffect(() => {
    if (!editorInstance || !currentFileContent) return;

    const currentModel = editorInstance.getModel();
    if (!currentModel) return;

    // If the model is empty but we have content, set it immediately
    if (currentModel.getValue() === "" && currentFileContent) {
      console.log("Setting initial content on empty model");
      currentModel.setValue(currentFileContent);
    }
  }, [editorInstance, currentFileContent]);

  // Content management - only updates content, never switches models
  useEffect(() => {
    if (!editorInstance || !currentFileUid) return;

    const currentModel = editorInstance.getModel();
    if (!currentModel) {
      console.warn("No active model to update content");
      return;
    }

    const currentValue = currentModel.getValue();

    // Only update content if it's different to avoid recursive updates
    if (
      currentValue !== currentFileContent &&
      currentFileContent !== undefined
    ) {
      console.log("Updating model content for:", currentFileUid);

      // Save cursor and scroll position
      const selections = editorInstance.getSelections();
      const scrollPosition = editorInstance.getScrollTop();

      // Set content without triggering the onChange event
      currentModel.pushEditOperations(
        [],
        [
          {
            range: currentModel.getFullModelRange(),
            text: currentFileContent,
          },
        ],
        () => null,
      );

      // Restore cursor and scroll position
      if (selections) {
        editorInstance.setSelections(selections);
      }
      editorInstance.setScrollTop(scrollPosition);
    }
  }, [currentFileContent, currentFileUid, editorInstance]);

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

  // Recovery mechanism if content is missing
  useEffect(() => {
    // Wait a short time after the component renders to check if content is missing
    const timer = setTimeout(() => {
      if (!editorInstance) return;

      const currentModel = editorInstance.getModel();
      if (!currentModel) return;

      const modelContent = currentModel.getValue();

      // If the model is empty but Redux has content, force an update
      if (!modelContent && currentFileContent) {
        console.warn(
          "Recovery: Detected empty editor with available content. Forcing update.",
        );
        currentModel.setValue(currentFileContent);
      }
    }, 100); // Short delay to let normal rendering complete

    return () => clearTimeout(timer);
  }, [editorInstance, currentFileContent, currentFileUid]);

  return useMemo(() => {
    return (
      <Editor
        onMount={handleEditorDidMount}
        theme={theme}
        language={language}
        path={language}
        onChange={(value) => handleOnChange(value, currentFileUid)}
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
    editorConfigs,
    codeErrors,
    currentFileUid,
    wordWrap,
  ]);
}
