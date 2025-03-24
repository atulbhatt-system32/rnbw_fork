import { useCallback, useContext, useEffect, useRef, useState } from "react";

import { editor } from "monaco-editor";
import { useDispatch, useSelector } from "react-redux";
import { CodeViewSyncDelay_Long, DefaultTabSize } from "@src/constants";
import { MainContext } from "@_redux/main";
import { setCodeViewTabSize } from "@_redux/main/codeView";
import { useAppState } from "@_redux/useAppState";

import { getCodeViewTheme, getLanguageFromExtension } from "./helpers";
import { TCodeSelection } from "./types";
import { useSaveCommand } from "@src/processor/hooks";
import { setIsCodeTyping } from "@_redux/main/reference";
import { debounce } from "@src/helper";
import { setFileTreeNodes } from "@_redux/main/fileTree";

import { useMonacoEditor } from "@src/context/editor.context";
import {
  ensureInitialContent,
  getFileLanguage,
  recoverMissingContent,
  updateModelContent,
} from "@src/services/editor.service";
import { AppState, store } from "@src/_redux/store";
import * as monaco from "monaco-editor";
import { setCurrentPageThunk } from "@src/_redux/main/currentPage/currentPage.thunk";

const useEditor = () => {
  const {
    editorInstance,
    setEditorInstance,
    editorModels,
    setEditorModels,
    isProgrammaticallyUpdated,
  } = useMonacoEditor();
  const currentFileContent = useSelector(
    (state: AppState) => state.main.currentPage.content,
  );
  const currentFileUid = useSelector(
    (state: AppState) => state.main.currentPage.uid,
  );
  const dispatch = useDispatch();
  const { theme: _theme, autoSave, isCodeTyping, fileTree } = useAppState();
  const { onUndo, onRedo } = useContext(MainContext);

  /* we need to keep the state of the app in a ref
  because onChange closure is not updated when the state changes */

  // theme
  const [theme, setTheme] = useState<"vs-dark" | "light">();

  // language
  const [language, setLanguage] = useState("html");
  const updateLanguage = useCallback((extension: string) => {
    const language = getLanguageFromExtension(extension);
    setLanguage(language);
  }, []);

  const editorConfigs: editor.IEditorConstructionOptions = {
    contextmenu: true,
    wordWrap: "on",
    minimap: { enabled: false },
    automaticLayout: true,
    selectionHighlight: false,
    autoClosingBrackets: "always",
    autoIndent: "full",
    autoClosingQuotes: "always",
    autoClosingOvertype: "always",
    autoSurround: "languageDefined",
    codeLens: false,
    formatOnPaste: true,
    formatOnType: true,
    tabCompletion: "on",
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: "on",
    inlineSuggest: { enabled: true },
    quickSuggestions: true,
    snippetSuggestions: "inline",
  };

  // code selection
  const [codeSelection, _setCodeSelection] = useState<TCodeSelection | null>(
    null,
  );
  const codeSelectionRef = useRef<TCodeSelection | null>(null);
  const isCodeEditingView = useRef(false);

  const { debouncedAutoSave } = useSaveCommand();

  const manageEditorModel = () => {
    if (!editorInstance || !currentFileUid) return;

    const languageId = getFileLanguage({
      fileTree,
      currentFileUid,
    });
    const modelId = currentFileUid;

    try {
      console.log("Switching to model for file:", modelId);

      // Save scroll position first
      const scrollTop = editorInstance.getScrollTop();
      const viewState = editorInstance.saveViewState();

      // Check if we already have a model for this file
      if (editorModels[modelId]) {
        console.log("Using existing model for:", modelId);
        editorInstance.setModel(editorModels[modelId]);
      } else {
        console.log("Creating new model for:", modelId);
        const newModel = monaco.editor.createModel(
          currentFileContent || "",
          languageId,
        );
        setEditorModels((prev) => ({ ...prev, [modelId]: newModel }));
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
  };

  const syncLanguage = useCallback(() => {
    const language = getFileLanguage({
      fileTree,
      currentFileUid,
    });
    if (language) {
      updateLanguage(language);
    }
  }, [fileTree, currentFileUid, updateLanguage]);

  // handleOnChange
  const onChange = useCallback(
    (value: string) => {
      // Getting the values from the store because the closure is not updated when the state changes
      const currentFileUid = store.getState().main.currentPage.uid;
      if (!currentFileUid) {
        console.error("No current file uid");
        return;
      }

      const fileTree = store.getState().main.file.fileTree;
      const file = structuredClone(fileTree[currentFileUid]);
      if (file && file.data) {
        const fileData = file.data;
        fileData.content = value;
        dispatch(setFileTreeNodes([file]));
      }

      dispatch(
        setCurrentPageThunk({
          uid: currentFileUid,
          content: value,
          updateType: "type",
        }),
      );

      // if (!isProgrammaticallyUpdated) {
      //   const selectedRange: Selection | null =
      //     editorInstance?.getSelection() || null;
      //   dispatch(
      //     setNeedToSelectCode(
      //       selectedRange
      //         ? {
      //             startLineNumber: selectedRange.startLineNumber,
      //             startColumn: selectedRange.startColumn,
      //             endLineNumber: selectedRange.endLineNumber,
      //             endColumn: selectedRange.endColumn,
      //           }
      //         : null,
      //     ),
      //   );
      // }

      autoSave && debouncedAutoSave();
      isCodeTyping && dispatch(setIsCodeTyping(false));
    },
    [autoSave, debouncedAutoSave, currentFileUid, dispatch, fileTree],
  );

  const handleKeyDown = () => {
    isCodeEditingView.current = true;
  };

  const longDebouncedOnChange = useCallback(
    debounce(onChange, CodeViewSyncDelay_Long),
    [onChange],
  );

  // const handleOnChange = useCallback(
  //   (value: string | undefined) => {
  //     if (value === undefined) return;

  //     if (isProgrammaticallyUpdated) {
  //       onChange(value);
  //     } else {
  //       !isCodeTyping && dispatch(setIsCodeTyping(true));
  //       longDebouncedOnChange(value);
  //     }
  //   },
  //   [longDebouncedOnChange, onChange],
  // );

  // handlerEditorDidMount
  const handleEditorDidMount = useCallback(
    (editor: editor.IStandaloneCodeEditor) => {
      console.log("Editor mounted:", editor);
      setEditorInstance(editor);

      // Set up model change listener
      editor.onDidChangeModelContent(() => {
        const model = editor.getModel();
        if (model) {
          const value = model.getValue();
          // Only trigger onChange if the change was made by the user (not programmatically)
          if (!isProgrammaticallyUpdated) {
            // const selectedRange: Selection | null =
            //   editor.getSelection() || null;

            // // Update code selection state
            // _setCodeSelection(selectedRange);

            // dispatch(
            //   setNeedToSelectCode(
            //     selectedRange
            //       ? {
            //           startLineNumber: selectedRange.startLineNumber,
            //           startColumn: selectedRange.startColumn,
            //           endLineNumber: selectedRange.endLineNumber,
            //           endColumn: selectedRange.endColumn,
            //         }
            //       : null,
            //   ),
            // );
            // !isProgrammaticallyUpdated && dispatch(setIsCodeTyping(true));
            longDebouncedOnChange(value);
          }
        }
      });

      // Set up selection change listener
      editor.onDidChangeCursorSelection((e) => {
        _setCodeSelection(e.selection);
      });
    },
    [dispatch, longDebouncedOnChange],
  );

  // undo/redo
  const [undoRedoToggle] = useState<{
    action: "none" | "undo" | "redo";
    toggle: boolean;
  }>({ action: "none", toggle: false });

  // set default tab-size
  useEffect(() => {
    dispatch(setCodeViewTabSize(DefaultTabSize));
  }, []);

  useEffect(() => {
    setTheme(getCodeViewTheme(_theme));
  }, [_theme]);

  useEffect(() => {
    codeSelectionRef.current = codeSelection;
    isCodeEditingView.current = true;
  }, [codeSelection]);

  useEffect(() => {
    if (undoRedoToggle.action === "undo") {
      onUndo();
    } else if (undoRedoToggle.action === "redo") {
      onRedo();
    }
  }, [undoRedoToggle]);

  // Call functions from useEffects
  useEffect(() => {
    syncLanguage();
  }, [syncLanguage]);

  useEffect(() => {
    // Use setTimeout to let rendering complete
    const timer = setTimeout(() => {
      recoverMissingContent({
        editorInstance,
        currentFileContent,
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [recoverMissingContent, editorInstance, currentFileContent]);

  useEffect(() => {
    updateModelContent({
      editorInstance,
      currentFileContent,
      currentFileUid,
    });
  }, [updateModelContent, editorInstance, currentFileContent, currentFileUid]);

  useEffect(() => {
    ensureInitialContent({
      editorInstance,
      currentFileContent,
    });
  }, [ensureInitialContent, editorInstance, currentFileContent]);

  useEffect(() => {
    manageEditorModel();
  }, [manageEditorModel]);

  useEffect(() => {
    console.log("currentFileUid", currentFileUid);
  }, [currentFileUid]);

  return {
    handleEditorDidMount,
    // handleOnChange,
    handleKeyDown,
    theme,
    currentFileUid,
    language,
    updateLanguage,

    editorConfigs,

    codeSelection,
  };
};

export default useEditor;
