/* eslint-disable react/prop-types */
//FIXME: This file is a temporary solution to use the Filer API in the browser.
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useDispatch, useSelector } from "react-redux";

import { TreeView } from "@src/components";

import { DargItemImage } from "@src/constants";
import { THtmlNodeData } from "@_api/index";
import { TNodeUid } from "@_api/types";
import {
  debounce,
  isWebComponentDblClicked,
  onWebComponentDblClick,
  scrollToElement,
} from "@src/helper";

import {
  collapseNodeTreeNodes,
  expandNodeTreeNodes,
} from "@_redux/main/nodeTree";
import {
  setActivePanel,
  setNavigatorDropdownType,
} from "@_redux/main/processor";
import { useAppState } from "@_redux/useAppState";
import { getCommandKey } from "../../rnbw";

import { useCmdk } from "./hooks/useCmdk";
import { useNodeTreeCallback } from "./hooks/useNodeTreeCallback";

import { DragBetweenLine } from "./nodeTreeComponents/DragBetweenLine";
import { NodeIcon } from "./nodeTreeComponents/NodeIcon";
import {
  ItemArrow,
  ItemTitle,
  Container,
  TreeItem,
} from "@src/sidebarView/treeComponents";
import { useNavigate } from "react-router-dom";
import { THtmlElementsReference } from "@rnbws/rfrncs.design";
import { AppState } from "@src/_redux/store";
import { TreeNodeData } from "@src/types/html.types";
import {
  setExpandedNodeUidsThunk,
  setHoveredNodeUidThunk,
} from "@src/_redux/main/currentPage/currentPage.thunk";
import { setHoveredNodeUid } from "@src/_redux/main/currentPage/currentPage.slice";

const AutoExpandDelayOnDnD = 1 * 1000;
const dragAndDropConfig = {
  canDragAndDrop: true,
  canDropOnFolder: true,
  canDropOnNonFolder: true,
  canReorderItems: true,
};
const searchConfig = {
  canSearch: false,
  canSearchByStartingTyping: false,
  canRename: false,
};

const NodeTreeView = () => {
  const dispatch = useDispatch();
  const {
    activePanel,
    osType,
    navigatorDropdownType,
    fileTree,
    currentFileUid,

    validNodeTree,

    nFocusedItem: focusedItem,

    fExpandedItemsObj,
    htmlReferenceData,
  } = useAppState();
  const newNodeTree = useSelector(
    (state: AppState) => state.main.currentPage.newNodeTree,
  );
  const { selectedNodeUids, focusedNodeUid, expandedNodeUids, hoveredNodeUid } =
    useSelector((state: AppState) => state.main.currentPage.nodeTreeViewState);
  const navigate = useNavigate();
  // ------ sync ------
  // cmdk
  useCmdk();

  // outline the hovered item
  const hoveredItemRef = useRef<TNodeUid>(hoveredNodeUid);
  useEffect(() => {
    if (hoveredItemRef.current === hoveredNodeUid) return;

    const curHoveredElement = document.querySelector(
      `#NodeTreeView-${hoveredItemRef.current}`,
    ) as HTMLElement | null;

    if (curHoveredElement) {
      curHoveredElement.style.removeProperty("outline-width");
      curHoveredElement.style.removeProperty("outline-style");
      curHoveredElement.style.removeProperty("outline-offset");
    }

    const newHoveredElement = document.querySelector(
      `#NodeTreeView-${hoveredNodeUid}`,
    ) as HTMLElement | null;

    if (newHoveredElement) {
      newHoveredElement.style.outlineWidth = "1px";
      newHoveredElement.style.outlineStyle = "solid";
      newHoveredElement.style.outlineOffset = "-1px";
    }

    hoveredItemRef.current = hoveredNodeUid;
  }, [hoveredNodeUid]);

  // scroll to the focused item
  const focusedItemRef = useRef<TNodeUid>(focusedItem);
  useEffect(() => {
    if (focusedItemRef.current === focusedItem) return;

    const focusedElement = document.querySelector(
      `#NodeTreeView-${focusedItem}`,
    );
    focusedElement && scrollToElement(focusedElement);

    focusedItemRef.current = focusedItem;
  }, [focusedItem]);

  // build nodeTreeViewData
  // const nodeTreeViewData = useMemo(() => {
  //   const data: TreeViewData = {};
  //   for (const uid in validNodeTree) {
  //     const node = validNodeTree[uid];
  //     data[uid] = {
  //       index: node.uid,
  //       data: node,
  //       children: node.children,
  //       isFolder: !node.isEntity,
  //       canMove: uid !== RootNodeUid,
  //       canRename: uid !== RootNodeUid,
  //     };
  //   }

  //   return data;
  // }, [validNodeTree, nExpandedItemsObj]);

  // node view state handlers
  // const { cb_expandNode } = useNodeViewState();
  const [nextToExpand, setNextToExpand] = useState<TNodeUid | null>(null);

  const onPanelClick = useCallback(() => {
    activePanel !== "node" && dispatch(setActivePanel("node"));
    navigatorDropdownType && dispatch(setNavigatorDropdownType(null));
  }, [navigatorDropdownType, activePanel]);

  // open web component
  const openWebComponent = useCallback(
    (item: TNodeUid) => {
      const nodeData = validNodeTree[item].data as THtmlNodeData;
      // check the element is wc
      if (
        isWebComponentDblClicked({
          nodeData,
          htmlReferenceData,
        })
      ) {
        onWebComponentDblClick({
          wcName: nodeData.nodeName,
          validNodeTree,
          dispatch,
          expandedItemsObj: fExpandedItemsObj,
          fileTree,
          navigate,
        });
      }
    },
    [htmlReferenceData, validNodeTree, fileTree],
  );

  const isDragging = useRef<boolean>(false);
  const callbacks = useNodeTreeCallback(isDragging);

  const debouncedExpand = useCallback(
    debounce((uid) => {
      if (uid === nextToExpand) {
        dispatch(setExpandedNodeUidsThunk([uid]));
      }
    }, AutoExpandDelayOnDnD),
    [nextToExpand],
  );

  return currentFileUid !== "" && !!htmlReferenceData ? (
    <div
      id="NodeTreeView"
      style={{
        width: "100%",
        height: "100%",
        overflow: "auto",
        paddingBottom: "16px",
        maxHeight: "calc(100vh - 42px)",
        msOverflowStyle: "none",
        scrollbarWidth: "none",
      }}
      onClick={onPanelClick}
    >
      <style>
        {`
        #root #NodeTreeView ul > li {
          line-height: 100%;
          padding: 0px;
          overflow: hidden;
        }
      `}
      </style>
      <TreeView
        width={"100%"}
        height={"auto"}
        info={{ id: "node-tree-view" }}
        data={newNodeTree}
        focusedItem={focusedNodeUid}
        selectedItems={selectedNodeUids}
        expandedItems={expandedNodeUids}
        renderers={{
          renderTreeContainer: (props) => <Container {...props} />,
          renderItemsContainer: (props) => <Container {...props} />,
          renderItem: (props) => {
            const htmlElementReferenceData =
              useMemo<THtmlElementsReference>(() => {
                const node = props.item as TreeNodeData;

                const nodeData = node.data;
                let nodeName = nodeData.nodeName;

                if (nodeName === "!doctype") {
                  nodeName = "!DOCTYPE";
                } else if (nodeName === "#comment") {
                  nodeName = "comment";
                }
                const refData = htmlReferenceData.elements[nodeName];
                return refData;
              }, [props.item.data]);

            const onClick = useCallback(
              (e: React.MouseEvent) => {
                e.stopPropagation();

                !props.context.isFocused && props.context.focusItem();

                if (e.shiftKey) {
                  props.context.selectUpTo();
                } else if (getCommandKey(e, osType)) {
                  if (props.context.isSelected) {
                    props.context.unselectItem();
                  } else {
                    props.context.addToSelectedItems();
                  }
                } else {
                  props.context.selectItem();
                }

                activePanel !== "node" && dispatch(setActivePanel("node"));

                navigatorDropdownType !== null &&
                  dispatch(setNavigatorDropdownType(null));
              },
              [props.context, navigatorDropdownType, activePanel],
            );

            const onDoubleClick = useCallback(
              (e: React.MouseEvent) => {
                e.stopPropagation();
                openWebComponent(props.item.index as TNodeUid);
              },
              [props.item],
            );

            const onMouseEnter = () => {
              let _uid = props?.item?.index;
              if (_uid === null || _uid === undefined) return;
              let node = newNodeTree[_uid];
              while (!_uid) {
                _uid = node.data.parentId;
                !_uid ? (node = newNodeTree[_uid]) : null;
              }
              if (_uid && _uid !== hoveredNodeUid) {
                dispatch(setHoveredNodeUidThunk(_uid as string));
              }
            };

            const onMouseLeave = useCallback(() => {
              if (hoveredNodeUid !== "") dispatch(setHoveredNodeUid(""));
            }, []);

            const onDragStart = (e: React.DragEvent) => {
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setDragImage(DargItemImage, 0, 0);
              props.context.startDragging();

              isDragging.current = true;
            };

            const onDragEnter = () => {
              if (!props.context.isExpanded) {
                setNextToExpand(props.item.index as TNodeUid);
                debouncedExpand(props.item.index as TNodeUid);
              }
            };

            return (
              <TreeItem
                {...props}
                key={`NodeTreeView-${props.item.index}${props?.item?.data?.nodeName}`}
                id={`NodeTreeView-${props.item.index}`}
                eventHandlers={{
                  onClick: onClick,
                  onDoubleClick: onDoubleClick,
                  onMouseEnter: onMouseEnter,
                  onMouseLeave: onMouseLeave,
                  onFocus: () => {},
                  onDragStart: onDragStart,
                  onDragEnter: onDragEnter,
                }}
                nodeIcon={
                  <NodeIcon
                    {...{
                      htmlElementReferenceData,
                      nodeName: props.item.data.nodeName,
                      componentTitle: props.item.data.nodeName,
                    }}
                  />
                }
              />
            );
          },

          renderItemArrow: ({ item, context }) => {
            const onClick = useCallback(() => {
              context.toggleExpandedState();
              if (context.isExpanded) {
                dispatch(collapseNodeTreeNodes([item.index as TNodeUid]));
              } else {
                dispatch(expandNodeTreeNodes([item.index as TNodeUid]));
              }
            }, [context]);

            return (
              <ItemArrow item={item} context={context} onClick={onClick} />
            );
          },

          renderItemTitle: ({ title }) => <ItemTitle title={title} />,
          renderDragBetweenLine: (props) => <DragBetweenLine {...props} />,
        }}
        props={{
          ...dragAndDropConfig,
          ...searchConfig,
        }}
        callbacks={callbacks}
      />
    </div>
  ) : (
    <></>
  );
};

export default NodeTreeView;
