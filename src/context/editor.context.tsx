import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useRef,
} from "react";
import * as monaco from "monaco-editor";
import { TNodeUid, TNodePositionInfo } from "@_api/types";
interface MonacoEditorContextType {
  editorInstance: monaco.editor.IStandaloneCodeEditor | null;
  setEditorInstance: React.Dispatch<
    React.SetStateAction<monaco.editor.IStandaloneCodeEditor | null>
  >;
  editorModels: Record<string, monaco.editor.ITextModel>;
  setEditorModels: React.Dispatch<
    React.SetStateAction<Record<string, monaco.editor.ITextModel>>
  >;
  isEditorReady: boolean;
  setIsEditorReady: React.Dispatch<React.SetStateAction<boolean>>;
  isProgrammaticallyUpdated: boolean;
  setIsProgrammaticallyUpdated: (value: boolean) => void;
  nodeUidPositions: Map<TNodeUid, TNodePositionInfo>;
  setNodeUidPositions: React.Dispatch<
    React.SetStateAction<Map<TNodeUid, TNodePositionInfo>>
  >;
}

const MonacoEditorContext = createContext<MonacoEditorContextType | undefined>(
  undefined,
);

export const useMonacoEditor = () => {
  const context = useContext(MonacoEditorContext);
  if (!context) {
    throw new Error(
      "useMonacoEditor must be used within a MonacoEditorProvider",
    );
  }
  return context;
};

export const MonacoEditorProvider = ({ children }: { children: ReactNode }) => {
  const [editorInstance, setEditorInstance] =
    useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [editorModels, setEditorModels] = useState<
    Record<string, monaco.editor.ITextModel>
  >({});
  const [isEditorReady, setIsEditorReady] = useState(false);
  const isProgrammaticallyUpdatedRef = useRef(false);
  const [nodeUidPositions, setNodeUidPositions] = useState<
    Map<TNodeUid, TNodePositionInfo>
  >(new Map());
  return (
    <MonacoEditorContext.Provider
      value={{
        editorInstance,
        setEditorInstance,
        editorModels,
        setEditorModels,
        isEditorReady,
        setIsEditorReady,
        isProgrammaticallyUpdated: isProgrammaticallyUpdatedRef.current,
        setIsProgrammaticallyUpdated: (value) => {
          isProgrammaticallyUpdatedRef.current = value;
        },
        nodeUidPositions,
        setNodeUidPositions,
      }}
    >
      {children}
    </MonacoEditorContext.Provider>
  );
};

export default MonacoEditorProvider;
