import { DraggingPosition, TreeItem, TreeItemIndex } from "react-complex-tree";

import { getValidNodeUids } from "@_api/helpers";
import { TNodeUid } from "@_api/types";
import { useAppState } from "@_redux/useAppState";

import useRnbw from "@_services/useRnbw";

import { useDispatch } from "react-redux";
import {
  addExpandedNodeUidThunk,
  removeExpandedNodeUidThunk,
  setSelectedNodeUidsThunk,
} from "@src/_redux/main/currentPage/currentPage.thunk";
export const useNodeTreeCallback = (
  isDragging: React.MutableRefObject<boolean>,
) => {
  const { validNodeTree, htmlReferenceData } = useAppState();
  const rnbw = useRnbw();
  const dispatch = useDispatch();

  const onSelectItems = (items: TreeItemIndex[]) => {
    dispatch(setSelectedNodeUidsThunk(items as TNodeUid[]));
  };
  const onFocusItem = () => {
    // cb_focusNode();
  };
  const onExpandItem = (item: TreeItem) => {
    dispatch(addExpandedNodeUidThunk(item.index as TNodeUid));
  };
  const onCollapseItem = (item: TreeItem) => {
    dispatch(removeExpandedNodeUidThunk(item.index as TNodeUid));
  };

  const onDrop = (
    items: TreeItem[],
    target: DraggingPosition & {
      parentItem?: TreeItemIndex;
      targetItem?: TreeItemIndex;
    },
  ) => {
    const isBetween = target.targetType === "between-items";
    const targetUid = (
      target.targetType === "item" ? target.targetItem : target.parentItem
    ) as TNodeUid;
    const position = isBetween ? target.childIndex : 0;

    const validUids = getValidNodeUids(
      validNodeTree,
      items.map((item) => item.data.uid),
      targetUid,
      "html",
      htmlReferenceData,
    );
    if (validUids.length === 0) return;

    if (target.parentItem === "ROOT") return;

    rnbw.elements.move({
      selectedUids: validUids,
      targetUid,
      isBetween,
      position,
    });

    isDragging.current = false;
  };

  return {
    onSelectItems,
    onFocusItem,
    onExpandItem,
    onCollapseItem,
    onDrop,
  };
};
