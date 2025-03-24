import { useSelector } from "react-redux";
import { objectToMap } from "./main/nodeTree/event/slice";
import { AppState } from "./store";

export const useAppState = () => {
  const {
    global: { osType, theme },
    main: {
      file: {
        workspace,
        project,
        initialFileUidToOpen,
        prevFileUid,
        fileTree,
        fileTreeViewState: {
          focusedItem: fFocusedItem,
          expandedItemsObj: fExpandedItemsObj,
          selectedItemsObj: fSelectedItemsObj,
        },
        hoveredFileUid,
        doingFileAction,
        lastFileAction,
        invalidFileNodes,
      },
      fileEvent: {
        past: fileEventPast,
        present: { fileAction },
        future: fileEventFuture,
      },
      nodeTree: {
        nodeTree,
        validNodeTree,
        needToSelectNodePaths,
        needToSelectCode,
        nodeTreeViewState: {
          focusedItem: nFocusedItem,
          expandedItemsObj: nExpandedItemsObj,
          selectedItemsObj: nSelectedItemsObj,
        },
        hoveredNodeUid,
        copiedNodeDisplayName,
      },
      nodeEvent: {
        past: nodeEventPast,
        present: {
          currentFileContent,
          selectedNodeUids,
          nodeUidPositions: nodeUidPositionsObj,
          currentFileUid,
        },
        future: nodeEventFuture,
      },
      designView: { iframeLoading, linkToOpen, syncConfigs },
      codeView: {
        editingNodeUid: editingNodeUidInCodeView,
        codeViewTabSize,
        codeErrors,
      },
      processor: {
        runningAction,
        navigatorDropdownType,
        favicon,
        activePanel,
        clipboardData,
        autoSave,
        wordWrap,
        didUndo,
        didRedo,
        loading,
      },
      reference: {
        filesReferenceData,
        htmlReferenceData,
        isContentProgrammaticallyChanged,
        isCodeTyping,
      },
      project: { projectHandlers, currentProjectFileHandle, fileHandlers },
      cmdk: {
        cmdkOpen,
        cmdkPages,
        currentCmdkPage,
        cmdkSearchContent,
        currentCommand,
        cmdkReferenceData,
      },
    },
  } = useSelector((state: AppState) => state);

  const fileEventPastLength = fileEventPast.length;
  const fileEventFutureLength = fileEventFuture.length;

  const nodeEventPastLength = nodeEventPast.length;
  const nodeEventFutureLength = nodeEventFuture.length;

  // Convert the serialized object back to a Map
  const nodeUidPositions = objectToMap(nodeUidPositionsObj);

  return {
    osType,
    theme,

    workspace,
    project,
    initialFileUidToOpen,
    currentFileUid,
    prevFileUid,
    fileTree,

    fFocusedItem,
    fExpandedItemsObj,
    fSelectedItemsObj,
    hoveredFileUid,

    doingFileAction,
    lastFileAction,
    invalidFileNodes,

    fileAction,
    fileEventPast,
    fileEventPastLength,
    fileEventFuture,
    fileEventFutureLength,

    nodeTree,
    validNodeTree,

    needToSelectNodePaths,
    needToSelectCode,

    nFocusedItem,
    nExpandedItemsObj,
    nSelectedItemsObj,
    hoveredNodeUid,
    copiedNodeDisplayName,

    currentFileContent,
    selectedNodeUids,
    nodeUidPositions,

    nodeEventPast,
    nodeEventPastLength,
    nodeEventFuture,
    nodeEventFutureLength,

    iframeLoading,
    linkToOpen,
    syncConfigs,
    editingNodeUidInCodeView,
    codeViewTabSize,
    codeErrors,

    runningAction,

    navigatorDropdownType,
    favicon,

    activePanel,
    clipboardData,

    autoSave,
    wordWrap,

    didUndo,
    didRedo,
    loading,

    filesReferenceData,
    htmlReferenceData,
    isContentProgrammaticallyChanged,
    isCodeTyping,

    projectHandlers,
    currentProjectFileHandle,
    fileHandlers,

    cmdkOpen,
    cmdkPages,
    currentCmdkPage,

    cmdkSearchContent,
    currentCommand,
    cmdkReferenceData,
  };
};
