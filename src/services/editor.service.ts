import * as monaco from "monaco-editor";
import { TFileNodeData } from "@_api/index";

type FileTree = Record<string, { data: TFileNodeData }>;

export const getLanguageFromExtension = (ext: string): string => {
  const languageMap: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    html: "html",
    css: "css",
    json: "json",
    // Add more mappings as needed
  };

  return languageMap[ext] || ext;
};

export const getFileLanguage = ({
  fileTree,
  currentFileUid,
}: {
  fileTree: FileTree;
  currentFileUid: string;
}): string | undefined => {
  const file = fileTree[currentFileUid];
  if (!file) return;

  const fileData = file.data as TFileNodeData;
  const extension = fileData.ext;
  return getLanguageFromExtension(extension);
};

export const ensureInitialContent = ({
  editorInstance,
  currentFileContent,
}: {
  editorInstance: monaco.editor.IStandaloneCodeEditor | undefined | null;
  currentFileContent: string;
}) => {
  if (!editorInstance || !currentFileContent) return;

  const currentModel = editorInstance.getModel();
  if (!currentModel) return;

  // If the model is empty but we have content, set it immediately
  if (currentModel.getValue() === "" && currentFileContent) {
    console.log("Setting initial content on empty model");
    currentModel.setValue(currentFileContent);
  }
};

export const recoverMissingContent = ({
  editorInstance,
  currentFileContent,
}: {
  editorInstance: monaco.editor.IStandaloneCodeEditor | undefined | null;
  currentFileContent: string;
}) => {
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
};

export const updateModelContent = ({
  editorInstance,
  currentFileContent,
  currentFileUid,
}: {
  editorInstance: monaco.editor.IStandaloneCodeEditor | undefined | null;
  currentFileContent: string;
  currentFileUid: string;
}) => {
  if (!editorInstance || !currentFileUid) return;

  const currentModel = editorInstance.getModel();
  if (!currentModel) {
    console.warn("No active model to update content");
    return;
  }

  const currentValue = currentModel.getValue();

  // Only update content if it's different to avoid recursive updates
  if (currentValue !== currentFileContent && currentFileContent !== undefined) {
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
};

export default {
  getLanguageFromExtension,
  getFileLanguage,
  ensureInitialContent,
  recoverMissingContent,
  updateModelContent,
};
