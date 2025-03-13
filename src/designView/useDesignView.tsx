import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "@src/_redux/store";
import { TNodeUid } from "@_api/types";

import {
  setHoveredNodeUidThunk,
  setSelectedNodeUidsThunk,
} from "@src/_redux/main/currentPage/currentPage.thunk";
import htmlService from "@src/services/html.service";
import globalService from "@src/services/global.service";
export interface DesignViewProps {
  hoveredNode: TNodeUid | null;
  selectedNodes: TNodeUid[];
  handleNodeHover: (nodeId: TNodeUid | null) => void;
  handleNodeSelect: (nodeId: TNodeUid) => void;
  handleMultiNodeSelect: (nodeIds: TNodeUid[]) => void;
}

export const useDesignView = (): DesignViewProps => {
  const dispatch = useDispatch();

  // Get state from Redux store
  const hoveredNode = useSelector(
    (state: AppState) =>
      state.main.currentPage.nodeTreeViewState.hoveredNodeUid,
  );

  const selectedNodes = useSelector(
    (state: AppState) =>
      state.main.currentPage.nodeTreeViewState.selectedNodeUids,
  );

  const { showCodePanel, showTreePanel } = useSelector(
    (state: AppState) => state.global.panelsState,
  );

  // Event handlers
  const handleNodeHover = useCallback(
    (nodeId: TNodeUid | null) => {
      dispatch(setHoveredNodeUidThunk(nodeId || ""));
    },
    [dispatch],
  );

  const handleNodeSelect = useCallback(
    (nodeId: TNodeUid) => {
      dispatch(setSelectedNodeUidsThunk([nodeId]));
    },
    [dispatch],
  );

  const handleNodeDblClick = useCallback(
    (nodeId: TNodeUid, clickX?: number, clickY?: number) => {
      dispatch(setSelectedNodeUidsThunk([nodeId]));

      const isWebComponent = htmlService.checkIsNodeWebComponent(nodeId);
      if (isWebComponent) {
        //open the web component in editor
        console.log("open the web component in editor");
        //TODO: open the web component in editor
      } else {
        // Make the node editable with cursor position
        htmlService.makeNodeEditable(nodeId, clickX, clickY);
      }
    },
    [dispatch],
  );

  const handleMultiNodeSelect = useCallback(
    (nodeIds: TNodeUid[]) => {
      dispatch(setSelectedNodeUidsThunk(nodeIds));
    },
    [dispatch],
  );

  const handleNodeBlur = useCallback(
    (nodeId: TNodeUid) => {
      htmlService.makeNodeNonEditable(nodeId);
    },
    [dispatch],
  );

  const handleKeyDown = useCallback(
    (key: string) => {
      if (key === "Escape") {
        const elements = htmlService.findAndGetAllEditableNodes();
        if (elements?.length) {
          htmlService.makeAllEditableNodesNonEditable();
        } else {
          globalService.togglePanels({
            showCodePanel,
            showTreePanel,
          });
        }
      }
    },
    [showCodePanel, showTreePanel],
  );

  // Listen for messages from the iframe
  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
      // Only handle messages from our iframe
      if (!event.data || typeof event.data !== "object") {
        return;
      }

      const { type, nodeId, nodeIds, clickX, clickY, key } = event.data;

      switch (type) {
        case "nodeHover":
          //   handleNodeHover(nodeId);
          break;
        case "propagatedNodeHover":
          handleNodeHover(nodeId);
          break;
        case "nodeSelect":
          handleNodeSelect(nodeId);
          break;
        case "multiNodeSelect":
          handleMultiNodeSelect(nodeIds);
          break;
        case "nodeDblClick":
          handleNodeDblClick(nodeId, clickX, clickY);
          break;
        case "nodeBlur":
          handleNodeBlur(nodeId);
          break;
        case "keydown":
          handleKeyDown(key);
          break;
        // Add more event types as needed
      }
    };

    // Add event listener for messages from iframe
    window.addEventListener("message", handleIframeMessage);

    return () => {
      // Clean up event listener
      window.removeEventListener("message", handleIframeMessage);
    };
  }, [
    handleNodeHover,
    handleNodeSelect,
    handleMultiNodeSelect,
    handleNodeDblClick,
    handleKeyDown,
  ]);

  return {
    hoveredNode,
    selectedNodes,
    handleNodeHover,
    handleNodeSelect,
    handleMultiNodeSelect,
  };
};
