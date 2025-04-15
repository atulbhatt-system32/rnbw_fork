import { TNodeUid } from "@_api/types";
import { AppState } from "@src/_redux/store";
import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  expandAncestorsOfNodeThunk,
  setHoveredNodeUidThunk,
  setSelectedNodeUidsThunk,
} from "@src/_redux/main/currentPage/currentPage.thunk";
import globalService from "@src/services/global.service";
import htmlService from "@src/services/html.service";

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

  const nodeTree = useSelector(
    (state: AppState) => state.main.currentPage.newNodeTree,
  );

  const { showCodePanel, showTreePanel } = useSelector(
    (state: AppState) => state.global.panelsState,
  );

  // Event handlers
  const handleNodeHover = useCallback(
    (nodeId: TNodeUid | null) => {
      if (nodeId) {
        dispatch(setHoveredNodeUidThunk(nodeId));
        htmlService.markHoveredElement(nodeId);
      }
    },
    [dispatch],
  );

  const handlePropogatedNodeHover = useCallback(
    (hoveredNodeUid: TNodeUid | null) => {
      const hoverableUids = htmlService.getHoverableNodeUids();
      if (hoveredNodeUid !== null && hoverableUids.includes(hoveredNodeUid)) {
        htmlService.markHoveredElement(hoveredNodeUid);
        const uidToDispatch = hoveredNodeUid;
        dispatch(setHoveredNodeUidThunk(uidToDispatch));
      }
    },
    [dispatch, nodeTree, selectedNodes],
  );

  const handleNodeSelect = useCallback(
    (nodeId: TNodeUid) => {
      // Get state needed for logic
      const currentHoveredNode = hoveredNode; // Already available via useSelector
      const tree = nodeTree; // Already available via useSelector

      if (!nodeId) {
        // Optionally dispatch deselect all or handle differently
        dispatch(setSelectedNodeUidsThunk([]));
        return;
      }

      if (!currentHoveredNode) {
        // If nothing is hovered, a click shouldn't select anything based on hover
        return;
      }

      if (!tree || Object.keys(tree).length === 0) {
        return; // Cannot perform descendant check without tree
      }

      // Condition 1: Direct click on the hovered node
      if (nodeId === currentHoveredNode) {
        dispatch(setSelectedNodeUidsThunk([currentHoveredNode]));
        dispatch(expandAncestorsOfNodeThunk(currentHoveredNode));
      }
      // Condition 2: Clicked node is a descendant of the hovered node
      else {
        const isDescendant = htmlService.findDirectChildOnPath(
          nodeId, // potentialDescendantUid
          currentHoveredNode, // ancestorUid
          tree, // treeStructure
        );

        if (isDescendant !== false) {
          // Check if it returned a child UID (is descendant)
          // Select the HOVERED node, not the clicked one
          dispatch(setSelectedNodeUidsThunk([currentHoveredNode]));
          dispatch(expandAncestorsOfNodeThunk(currentHoveredNode));
        } else {
          // Clicked node is not the hovered node or its descendant
          // Do nothing
        }
      }
    },
    // Update dependencies
    [dispatch, hoveredNode, nodeTree],
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
      if (!event.data || typeof event.data !== "object") {
        return;
      }

      const { type, nodeId, nodeIds, clickX, clickY, key } = event.data;

      switch (type) {
        case "nodeHover":
          handleNodeHover(nodeId);
          break;
        case "propagatedNodeHover":
          handlePropogatedNodeHover(nodeId);
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
    nodeTree,
    selectedNodes,
    handleNodeHover,
    handlePropogatedNodeHover,
    handleNodeSelect,
    handleMultiNodeSelect,
    handleNodeDblClick,
    handleNodeBlur,
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
