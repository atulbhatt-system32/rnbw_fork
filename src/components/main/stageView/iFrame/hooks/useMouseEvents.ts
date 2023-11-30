import { useCallback, useContext } from "react";

import { useDispatch } from "react-redux";

import { TFileNodeData } from "@_node/file";
import { StageNodeIdAttr } from "@_node/file/handlers/constants";
import { getValidNodeUids } from "@_node/helpers";
import { TNode, TNodeUid } from "@_node/types";
import { MainContext } from "@_redux/main";
import { selectFileTreeNodes, setCurrentFileUid } from "@_redux/main/fileTree";
import { setHoveredNodeUid } from "@_redux/main/nodeTree";
import {
  NodeTree_Event_ClearActionType,
  setCurrentFileContent,
  setSelectedNodeUids,
} from "@_redux/main/nodeTree/event";
import {
  setActivePanel,
  setNavigatorDropdownType,
} from "@_redux/main/processor";
import { useAppState } from "@_redux/useAppState";

import { useSetSelectItem } from "./";

export interface IUseMouseEventsProps {
  externalDblclick: React.MutableRefObject<boolean>;
  linkTagUid: React.MutableRefObject<string>;
  selectedItemsRef: React.MutableRefObject<string[]>;
  mostRecentSelectedNode: React.MutableRefObject<TNode | undefined>;
  focusedItemRef: React.MutableRefObject<string>;
  contentRef: HTMLIFrameElement | null;
  contentEditableUidRef: React.MutableRefObject<string>;
  isEditing: React.MutableRefObject<boolean>;
  dblClickTimestamp: React.MutableRefObject<number>;
  isDblClick: boolean;
}

export const useMouseEvents = ({
  externalDblclick,
  selectedItemsRef,
  mostRecentSelectedNode,
  focusedItemRef,
  contentRef,
  contentEditableUidRef,
}: IUseMouseEventsProps) => {
  const firstClickEditableTags = [
    "p",
    "span",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "label",
    "a",
  ];

  const dispatch = useDispatch();
  const {
    prevRenderableFileUid,
    currentFileUid,
    nodeTree,
    hoveredNodeUid,
    nFocusedItem: focusedItem,
    fileTree,
    navigatorDropdownType,
  } = useAppState();

  const { setFocusedSelectedItems } = useSetSelectItem({
    mostRecentSelectedNode,
    focusedItemRef,
    contentRef,
  });

  function findEleOrItsNearestParentWithUid(ele: HTMLElement) {
    let newFocusedElement: HTMLElement = ele;
    let _uid: TNodeUid | null = newFocusedElement.getAttribute(StageNodeIdAttr);
    while (!_uid) {
      const parentEle = newFocusedElement.parentElement;
      if (!parentEle) break;
      _uid = parentEle.getAttribute(StageNodeIdAttr);
      newFocusedElement = parentEle;
      // !_uid ? (newFocusedElement = parentEle) : null;
    }
    return newFocusedElement;
  }

  function handleSelectofSingleOrMultipleElements(
    e: MouseEvent,
    uid: TNodeUid | null,
  ) {
    let multiple = false;

    if (uid) {
      if (e.shiftKey) {
        let found = false;
        const _selectedItems = selectedItemsRef.current.filter(
          (selectedUid) => {
            selectedUid === uid ? (found = true) : null;
            return selectedUid !== uid;
          },
        );

        !found ? _selectedItems.push(uid) : null;

        setFocusedSelectedItems(
          uid,
          getValidNodeUids(nodeTree, _selectedItems),
        );

        if (_selectedItems.length > 1) multiple = true;
      } else {
        if (uid !== focusedItem) {
          setFocusedSelectedItems(uid);
        }
      }
    }

    return multiple;
  }

  // MouseEvents Handlers
  const onMouseEnter = useCallback((e: MouseEvent) => {}, []);

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      const ele = e.target as HTMLElement;
      let _uid: TNodeUid | null = ele.getAttribute(StageNodeIdAttr);
      // for the elements which are created by js. (ex: Web Component)
      let newHoveredElement: HTMLElement = ele;
      while (!_uid) {
        const parentEle = newHoveredElement.parentElement;
        if (!parentEle) break;

        _uid = parentEle.getAttribute(StageNodeIdAttr);
        !_uid ? (newHoveredElement = parentEle) : null;
      }

      // set hovered item
      if (_uid && _uid !== hoveredNodeUid) {
        dispatch(setHoveredNodeUid(_uid));
      }
    },
    [hoveredNodeUid],
  );

  const onMouseLeave = (e: MouseEvent) => {
    dispatch(setHoveredNodeUid(""));
  };

  const onClick = useCallback(
    (e: MouseEvent) => {
      const ele = e.target as HTMLElement;

      // update file - WIP
      if (currentFileUid !== prevRenderableFileUid) {
        const file = fileTree[prevRenderableFileUid];
        const fileData = file.data as TFileNodeData;
        dispatch(setCurrentFileUid(prevRenderableFileUid));
        dispatch(setCurrentFileContent(fileData.content));
        dispatch(selectFileTreeNodes([prevRenderableFileUid]));
        // dispatch({ type: NodeTree_Event_ClearActionType });
      }

      // update node select status
      let _uid: TNodeUid | null = ele.getAttribute(StageNodeIdAttr);
      let newFocusedElement = ele;
      let isWC = false;
      while (!_uid) {
        // for the elements which are created by js. (ex: Web Component)
        isWC = true;
        const parentEle = newFocusedElement.parentElement;
        if (!parentEle) break;

        _uid = parentEle.getAttribute(StageNodeIdAttr);
        !_uid ? (newFocusedElement = parentEle) : null;
      }
      _uid && dispatch(setSelectedNodeUids([_uid]));

      // WIP
      /* const areMultiple = handleSelectofSingleOrMultipleElements(e, _uid);

      const isEditable = isEditableElement(ele);

      const canEditOnSingleClickConfig = {
        isSingle: !areMultiple,
        isEditable,
        isFocused: _uid === focusedItem,
        isNotAWC: !isWC,
        isNotAlreadyEditingEle: contentEditableUidRef.current !== _uid,
      };

      //check if all the keys have true value
      let canEditOnSingleClick = Object.values(
        canEditOnSingleClickConfig,
      ).every((val) => val === true); */

      dispatch(setActivePanel("stage"));

      navigatorDropdownType !== null &&
        dispatch(setNavigatorDropdownType(null));
    },
    [fileTree, prevRenderableFileUid, currentFileUid, navigatorDropdownType],
  );

  return {
    onClick,
    onMouseLeave,
    onMouseMove,
    onMouseEnter,
  };
};
