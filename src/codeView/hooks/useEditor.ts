import { useCallback, useContext, useEffect, useRef, useState } from "react";

import { editor, Selection } from "monaco-editor";
import { useDispatch } from "react-redux";
import { CodeViewSyncDelay_Long, DefaultTabSize } from "@src/constants";
import { MainContext } from "@_redux/main";
import { setCodeViewTabSize } from "@_redux/main/codeView";
import {
  setCurrentFileContent,
  setNeedToSelectCode,
} from "@_redux/main/nodeTree";
import { useAppState } from "@_redux/useAppState";

import { getCodeViewTheme, getLanguageFromExtension } from "../helpers";
import { TCodeSelection } from "../types";
import { useSaveCommand } from "@src/processor/hooks";
import { setIsCodeTyping } from "@_redux/main/reference";
import { debounce } from "@src/helper";
import { setFileTreeNodes } from "@_redux/main/fileTree";

import { useMonacoEditor } from "@src/context/editor.context";

const useEditor = () => {
  const { editorInstance, setEditorInstance } = useMonacoEditor();
  const dispatch = useDispatch();
  const {
    theme: _theme,
    autoSave,
    isCodeTyping,
    wordWrap,
    isContentProgrammaticallyChanged,
    currentFileUid,
    fileTree,
    activePanel,
  } = useAppState();
  const { onUndo, onRedo } = useContext(MainContext);

  /* we need to keep the state of the app in a ref
  because onChange closure is not updated when the state changes */
  const AppstateRef = useRef({
    theme: _theme,
    autoSave,
    isCodeTyping,
    wordWrap,
    isContentProgrammaticallyChanged,
    currentFileUid,
    fileTree,
    activePanel,
  });

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

  // handleOnChange
  const onChange = useCallback(
    (value: string, changedFileUid: string) => {
      if (
        changedFileUid === AppstateRef.current.currentFileUid ||
        changedFileUid === ""
      ) {
        dispatch(setCurrentFileContent(value));
      } else {
        const file = structuredClone(
          AppstateRef.current.fileTree[changedFileUid],
        );
        if (file && file.data) {
          const fileData = file.data;
          fileData.content = value;
          dispatch(setFileTreeNodes([file]));
        }
      }

      if (!AppstateRef.current.isContentProgrammaticallyChanged) {
        const selectedRange: Selection | null =
          editorInstance?.getSelection() || null;
        dispatch(
          setNeedToSelectCode(
            selectedRange
              ? {
                  startLineNumber: selectedRange.startLineNumber,
                  startColumn: selectedRange.startColumn,
                  endLineNumber: selectedRange.endLineNumber,
                  endColumn: selectedRange.endColumn,
                }
              : null,
          ),
        );
      }

      autoSave && debouncedAutoSave();
      AppstateRef.current.isCodeTyping && dispatch(setIsCodeTyping(false));
    },
    [autoSave, debouncedAutoSave],
  );

  const handleKeyDown = () => {
    isCodeEditingView.current = true;
  };

  const longDebouncedOnChange = useCallback(
    debounce(onChange, CodeViewSyncDelay_Long),
    [onChange],
  );

  const handleOnChange = useCallback(
    (value: string | undefined, changedFileUid: string) => {
      if (value === undefined) return;

      if (AppstateRef.current.isContentProgrammaticallyChanged) {
        onChange(value, changedFileUid);
      } else {
        !AppstateRef.current.isCodeTyping && dispatch(setIsCodeTyping(true));
        longDebouncedOnChange(value, changedFileUid);
      }
    },
    [longDebouncedOnChange, onChange],
  );

  // handlerEditorDidMount
  const handleEditorDidMount = useCallback(
    (editor: editor.IStandaloneCodeEditor) => {
      console.log("Editor mounted:", editor);
      setEditorInstance(editor);

      // Set up model change listener
      editor.onDidChangeModelContent((event) => {
        console.log("Model content changed:", event);
        const model = editor.getModel();
        if (model) {
          const value = model.getValue();
          // Only trigger onChange if the change was made by the user (not programmatically)
          if (!AppstateRef.current.isContentProgrammaticallyChanged) {
            const selectedRange: Selection | null =
              editor.getSelection() || null;

            // Update code selection state
            _setCodeSelection(selectedRange);

            dispatch(
              setNeedToSelectCode(
                selectedRange
                  ? {
                      startLineNumber: selectedRange.startLineNumber,
                      startColumn: selectedRange.startColumn,
                      endLineNumber: selectedRange.endLineNumber,
                      endColumn: selectedRange.endColumn,
                    }
                  : null,
              ),
            );
            !AppstateRef.current.isCodeTyping &&
              dispatch(setIsCodeTyping(true));
            longDebouncedOnChange(value, AppstateRef.current.currentFileUid);
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

  useEffect(() => {
    AppstateRef.current = {
      theme: _theme,
      autoSave,
      isCodeTyping,
      wordWrap,
      isContentProgrammaticallyChanged,
      currentFileUid,
      fileTree,
      activePanel,
    };
  }, [
    _theme,
    autoSave,
    isCodeTyping,
    wordWrap,
    isContentProgrammaticallyChanged,
    currentFileUid,
    fileTree,
    activePanel,
  ]);

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

  return {
    handleEditorDidMount,
    handleOnChange,
    handleKeyDown,
    theme,

    language,
    updateLanguage,

    editorConfigs,

    codeSelection,
  };
};

export default useEditor;
