import { TNodeTreeData, TNodeUid } from "@_api/types";
import { AppState } from "@src/_redux/store";
import { TreeStructure } from "@src/types/html.types";
import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  expandAncestorsOfNodeThunk,
  setHoveredNodeUidThunk,
  setSelectedNodeUidsThunk,
} from "@src/_redux/main/currentPage/currentPage.thunk";
import { StageNodeIdAttr } from "@src/constants";
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
  const handleNodeHoverWithModifier = useCallback(
    (nodeId: TNodeUid | null) => {
      if (nodeId) {
        dispatch(setHoveredNodeUidThunk(nodeId));
        htmlService.markHoveredElement(nodeId);
      }
    },
    [dispatch],
  );

  const handleNodeHover = useCallback(
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
      const tree = nodeTree as unknown as TNodeTreeData;
      const currentSelectedUid = selectedNodes[selectedNodes.length - 1];

      // If the tree is not found, do nothing
      if (!nodeId || !tree || Object.keys(tree).length === 0) {
        return;
      }

      // If no current selection, select the clicked node
      if (!currentSelectedUid) {
        dispatch(setSelectedNodeUidsThunk([nodeId]));
        dispatch(expandAncestorsOfNodeThunk(nodeId));
        return;
      }

      // Check if clicked node is a descendant of currently selected node
      const isDescendant = htmlService.findDirectChildOnPath(
        nodeId,
        currentSelectedUid,
        tree as unknown as TreeStructure,
      );

      // If it is, do nothing, since this can be the most common scenario when clicking around a HTML page,
      // and we don't need to unnecessarily calculate further conditions in this case.
      if (isDescendant !== false) {
        return;
      }

      // case 2.Check if nodes are siblings (share same parent)
      const foundSibling = htmlService.findSibling(nodeId);

      let foundAncestor;
      // if its a sibling node or the same node, no need to check for ancestor
      if (foundSibling !== false || nodeId === currentSelectedUid) {
        foundAncestor = false;
      } else {
        // case 3. Check if clicked node is an ancestor of currently selected node
        foundAncestor = htmlService.findAncestor(nodeId);
      }

      // Only select if:
      // 1. It's the same node
      // 2. It's a direct sibling (foundSibling === true)
      //  2.1. It's a descendant of a sibling (foundSibling is a string UID)
      // 3. It's an ancestor (parents and their siblings)
      //  3.1. It's a descendant of an ancestor excluding the current node (in which case we select the ancestor)
      if (
        foundSibling === true ||
        typeof foundSibling === "string" ||
        // case 1. It's the same node
        nodeId === currentSelectedUid ||
        foundAncestor
      ) {
        let nodeToSelect;
        if (typeof foundSibling === "string") {
          nodeToSelect = foundSibling;
        } else if (typeof foundAncestor === "string") {
          nodeToSelect = foundAncestor;
        } else {
          nodeToSelect = nodeId;
        }
        dispatch(setSelectedNodeUidsThunk([nodeToSelect]));
        dispatch(expandAncestorsOfNodeThunk(nodeToSelect));
      } else {
        // Do nothing
      }
    },
    [dispatch, nodeTree, selectedNodes],
  );

  const handleNodeSelectWithModifier = useCallback(
    (nodeId: TNodeUid) => {
      dispatch(setSelectedNodeUidsThunk([nodeId]));
      dispatch(expandAncestorsOfNodeThunk(nodeId));
    },
    [handleNodeSelect],
  );

  const handleNodeDblClick = useCallback(
    (nodeId: TNodeUid, clickX?: number, clickY?: number) => {
      const currentSelectedUids = selectedNodes; // From useSelector
      const tree = nodeTree; // From useSelector
      if (!tree || Object.keys(tree).length === 0) {
        return;
      }

      if (currentSelectedUids.length === 1) {
        const selectedNodeUid = currentSelectedUids[0];
        const textNodes = [
          "P",
          "H1",
          "H2",
          "H3",
          "H4",
          "H5",
          "H6",
          "SPAN",
          "A",
          "BUTTON",
          "LABEL",
        ];
        const iframe = document.getElementById("iframeId") as HTMLIFrameElement;

        // Use the new helper from htmlService
        const childToSelect = htmlService.findDirectChildOnPath(
          nodeId, // potentialDescendantUid
          selectedNodeUid, // ancestorUid
          tree, // treeStructure
        );

        if (childToSelect) {
          // It IS a descendant, select the intermediate child
          console.log(
            `handleNodeDblClick: Drilling down from ${selectedNodeUid} to ${childToSelect}`,
          );
          dispatch(setSelectedNodeUidsThunk([childToSelect]));
          dispatch(expandAncestorsOfNodeThunk(childToSelect));
        } else {
          // It's NOT a descendant (or is the selected node itself)
          // Only make text nodes editable
          const element = iframe?.contentWindow?.document?.querySelector(
            `[${StageNodeIdAttr}="${nodeId}"]`,
          );

          if (element && textNodes.includes(element.tagName)) {
            console.log(
              `handleNodeDblClick: Making text node ${nodeId} editable at coordinates (${clickX}, ${clickY})`,
            );
            htmlService.makeNodeEditable(nodeId, clickX, clickY);
          }
        }
      }
    },
    [dispatch, selectedNodes, nodeTree, hoveredNode],
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
        case "nodeHoverWithModifier":
          handleNodeHoverWithModifier(nodeId);
          break;
        case "nodeSelect":
          handleNodeSelect(nodeId);
          break;
        case "nodeSelectWithModifier":
          handleNodeSelectWithModifier(nodeId);
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
    handleNodeHoverWithModifier,
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
