import { useContext, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";

import { getNodeUidByCodeSelection } from "@src/codeView";
import { markSelectedElements } from "@src/designView/iFrame/helpers";
import { LogAllow } from "@src/constants";
import { _writeIDBFile } from "@_api/file";

import { TNodeUid } from "@_api/types";
import { MainContext } from "@_redux/main";
import { setCurrentCommand } from "@_redux/main/cmdk";
import {
  setCodeErrors,
  setEditingNodeUidInCodeView,
} from "@_redux/main/codeView";
import {
  setDoingFileAction,
  setFileTreeNodes,
  setInitialFileUidToOpen,
  setPrevFileUid,
} from "@_redux/main/fileTree";
import {
  expandNodeTreeNodes,
  focusNodeTreeNode,
  selectNodeTreeNodes,
  setExpandedNodeTreeNodes,
  setNeedToSelectCode,
  setNeedToSelectNodeUids,
  setNodeTree,
  setSelectedNodeUids,
} from "@_redux/main/nodeTree";

import { useAppState } from "@_redux/useAppState";

import {
  getNeedToExpandNodeUids,
  getNodeUidToBeSelectedAtFirst,
  getPreviewPath,
  getValidNodeTree,
  markChangedFolders,
} from "../helpers";
import {
  addRunningAction,
  removeRunningAction,
  setLoadingFalse,
  setLoadingTrue,
} from "@_redux/main/processor";

import { getObjKeys } from "@src/helper";
import { getFileExtension } from "@src/sidebarView/navigatorPanel/helpers";
import { useElementHelper } from "@_services/useElementsHelper";
import { notify } from "@src/services/notificationService";

// import Idiomorph from "idiomorph";
import { setCurrentPage } from "@src/_redux/main/currentPage/currentPage.slice";
import htmlService from "@src/services/html.service";
import { setCurrentPageNewNodeTreeThunk } from "@src/_redux/main/currentPage/currentPage.thunk";
import { serialize } from "parse5";
export const useNodeTreeEvent = () => {
  const dispatch = useDispatch();
  const {
    currentCommand,

    fileTree,
    initialFileUidToOpen,
    currentFileUid,
    prevFileUid,

    currentFileContent,
    selectedNodeUids,
    nodeUidPositions,

    validNodeTree,
    needToSelectCode,
    nExpandedItemsObj,
    nodeEventPast,
    didUndo,
    didRedo,
    activePanel,
  } = useAppState();

  const { parseHtml } = useElementHelper();
  const { iframeRefRef, maxNodeUidRef, setMaxNodeUidRef } =
    useContext(MainContext);

  const isSelectedNodeUidsChanged = useRef(false);
  const isCurrentFileContentChanged = useRef(false);
  const isCodeErrorsExist = useRef(false);
  const existingSelectedNodeUids = useRef<TNodeUid[]>([]);

  useEffect(() => {
    isSelectedNodeUidsChanged.current = false;
    isCurrentFileContentChanged.current = false;

    if (selectedNodeUids.length > 0) {
      existingSelectedNodeUids.current = selectedNodeUids;
    }
  }, [selectedNodeUids, currentFileContent]);

  useEffect(() => {
    isSelectedNodeUidsChanged.current = true;

    const focusedItem = selectedNodeUids.length > 0 ? selectedNodeUids[0] : "";
    // focus node
    dispatch(focusNodeTreeNode(focusedItem as TNodeUid));
    // select nodes
    dispatch(selectNodeTreeNodes(selectedNodeUids));
  }, [selectedNodeUids]);

  useEffect(() => {
    isCurrentFileContentChanged.current = true;
    // validate
    if (!fileTree[currentFileUid]) return;

    dispatch(addRunningAction());

    async function updateFileContent() {
      const file = structuredClone(fileTree[currentFileUid]);
      const fileData = file.data;
      const ext = fileData.ext;

      if (!currentFileContent) {
        dispatch(removeRunningAction());
        return;
      }

      if (ext === "html") {
        const document = htmlService.parseHtml(currentFileContent);
        const { complexNodeTree, document: previewDocument } =
          htmlService.createNodeTree(document);
        if (previewDocument) {
          const previewContent = serialize(previewDocument);
          dispatch(
            setCurrentPageNewNodeTreeThunk({
              nodeTree: complexNodeTree,
              previewContent,
            }),
          );

          fileData.contentInApp = previewContent;
        }
      }
      const { nodeTree, selectedNodeUids: selectedNodeUidsAfterActions } =
        ext === "html"
          ? await parseHtml(
              currentFileContent,
              maxNodeUidRef.current,
              nodeUidPositions,
              setMaxNodeUidRef,
            )
          : {
              nodeTree: {},
              selectedNodeUids: [],
            };

      fileData.content = currentFileContent;

      // fileData.contentInApp = contentInApp;

      fileData.changed = fileData.content !== fileData.orgContent;

      if (file.parentUid) {
        markChangedFolders(fileTree, file, dispatch, fileData.changed);
      }

      // when "Save" while text-editing, we need to call "Save" command after file-content updated.
      // after fileTree has been updated exactly. so when "Save" while text-editing, we should call "SaveForce" first.
      if (currentCommand?.action === "SaveForce") {
        dispatch(setCurrentCommand({ action: "Save" }));
      }

      // sync file-tree
      dispatch(setFileTreeNodes([file]));

      // update idb

      try {
        //creating the preview for stage-view
        const previewPath = getPreviewPath(fileTree, file);
        try {
          dispatch(setDoingFileAction(true));

          await _writeIDBFile(previewPath, fileData.contentInApp as string);
        } catch (err) {
          console.log(err);
        } finally {
          dispatch(setDoingFileAction(false));
        }
        if (fileData.ext === "html") {
          dispatch(
            setCurrentPage({
              uid: currentFileUid,
              designViewState: {
                previewPath: fileData.path,
                previewUrl: `rnbw${previewPath}`,
                previewContent: fileData.contentInApp || "",
              },
              nodeTree: nodeTree,
            }),
          );
        }
      } catch (err) {
        notify.info(
          "error",
          "An error occurred while updating the file content",
        );
        LogAllow && console.error(err);
      }

      // ---
      // code-view is already synced
      // ---

      // sync stage-view
      // if (prevFileUid === currentFileUid) {
      //   // dom-diff using morph
      //   if (fileData.ext === "html") {
      //     const iframe: HTMLIFrameElement | null = document.getElementById(
      //       "iframeId",
      //     ) as HTMLIFrameElement;

      //     if (iframe) {
      //       const iframeDoc = iframe.contentDocument;
      //       if (!iframeDoc) {
      //         dispatch(removeRunningAction());
      //         return;
      //       }
      //       const iframeHtml = iframeDoc.getElementsByTagName("html")[0];
      //       const documentHtml = iframeDoc.documentElement;

      //       const updatedHtml = contentInApp;
      //       if (!iframeHtml || !updatedHtml) {
      //         dispatch(removeRunningAction());
      //         return;
      //       }

      //       try {
      //         // Parse the updatedHtml string into a DOM node
      //         const parser = new DOMParser();
      //         const newDoc = parser.parseFromString(
      //           updatedHtml as string,
      //           "text/html",
      //         );

      //         const newContent = newDoc.documentElement; // Get the root element

      //         // Now use newContent with Idiomorph
      //         // Idiomorph.morph(documentHtml, newContent.innerHTML, {
      //         //   morphStyle: "innerHTML",
      //         //   head: { style: "morph" },
      //         //   callbacks: {
      //         //     beforeNodeRemoved: (node: Element) => {
      //         //       try {
      //         //         const isPreserve = node.getAttribute("im-preserve");

      //         //         if (isPreserve) {
      //         //           return false;
      //         //         }
      //         //       } catch (err) {
      //         //         console.error(err);
      //         //       }
      //         //       return true;
      //         //     },
      //         //     beforeNodeMorphed: (oldNode: Element, newNode: Node) => {
      //         //       // Handle custom elements specifically
      //         //       try {
      //         //         if (
      //         //           oldNode.tagName.includes("-") ||
      //         //           (newNode instanceof HTMLElement &&
      //         //             newNode.tagName.includes("-"))
      //         //         ) {
      //         //           // Custom logic for web components
      //         //           return false; // Prevent morphing if necessary
      //         //         }
      //         //         return true;
      //         //       } catch (err) {
      //         //         console.error(err);
      //         //       }
      //         //     },
      //         //   },
      //         // });

      //         isCodeErrorsExist.current = false;
      //       } catch (err) {
      //         isCodeErrorsExist.current = false;

      //         notify.info("error", "Some changes in the code are incorrect");
      //         console.error(err, "error");
      //       }
      //     }
      //   }
      // }

      dispatch(setCodeErrors(isCodeErrorsExist.current));
      if (isCodeErrorsExist.current) {
        dispatch(removeRunningAction());
        return;
      }

      // sync node-tree
      await dispatch(setNodeTree(nodeTree));
      const _validNodeTree = getValidNodeTree(nodeTree);

      const uid = getNodeUidToBeSelectedAtFirst(_validNodeTree);
      if (initialFileUidToOpen !== "" && fileTree[initialFileUidToOpen]) {
        LogAllow && console.log("it's a new project");
        dispatch(setInitialFileUidToOpen(""));
        dispatch(setSelectedNodeUids([uid]));

        dispatch(
          setExpandedNodeTreeNodes(
            getNeedToExpandNodeUids(_validNodeTree, [uid]),
          ),
        );
      } else if (prevFileUid !== currentFileUid) {
        if (fileData.ext === "html") {
          dispatch(setLoadingTrue());
        }
        LogAllow && console.log("it's a new file");

        const fileHistory = nodeEventPast.filter(
          (historyState) => historyState.currentFileUid == currentFileUid,
        );
        const lastCurrentFileHistoryState = fileHistory[fileHistory.length - 1];

        !(didUndo || didRedo) &&
          dispatch(
            setNeedToSelectNodeUids(
              activePanel === "stage" ||
                getFileExtension(fileTree[currentFileUid]) !== "html"
                ? selectedNodeUids
                : fileHistory.length
                  ? lastCurrentFileHistoryState?.selectedNodeUids
                  : [uid],
            ),
          );
        dispatch(
          setExpandedNodeTreeNodes(
            getNeedToExpandNodeUids(_validNodeTree, [uid]),
          ),
        );
      } else {
        if (selectedNodeUidsAfterActions.length > 0)
          markSelectedElements(
            iframeRefRef.current,
            selectedNodeUidsAfterActions,
            nodeTree,
          );
        const validExpandedItems = getObjKeys(nExpandedItemsObj).filter(
          (uid) =>
            _validNodeTree[uid] && _validNodeTree[uid].isEntity === false,
        );
        const needToExpandItems: TNodeUid[] = isSelectedNodeUidsChanged.current
          ? getNeedToExpandNodeUids(_validNodeTree, selectedNodeUids)
          : [];
        dispatch(
          setExpandedNodeTreeNodes([
            ...validExpandedItems,
            ...needToExpandItems,
          ]),
        );

        if (!isSelectedNodeUidsChanged.current) {
          // this change is from 'node actions' or 'typing in code-view'

          const _selectedNodeUids: TNodeUid[] = [];

          if (needToSelectCode) {
            LogAllow && console.log("it's a rnbw-change from code-view");
            // it's a typing change in code-view and we need to select currently `cursored node` in code-view.
            // in the case, `NodeActions -> setCurrentFileContent` and `setNeedToSelectNodeUids` dispatch actions are considered as an one event in the node-event-history.
            const needToSelectNodeUid = getNodeUidByCodeSelection(
              needToSelectCode,
              nodeTree,
              _validNodeTree,
            );
            dispatch(setEditingNodeUidInCodeView(needToSelectNodeUid));
            needToSelectNodeUid &&
              _selectedNodeUids.push(needToSelectNodeUid) &&
              dispatch(setNeedToSelectNodeUids([needToSelectNodeUid]));
            dispatch(setNeedToSelectCode(null));
          }

          // remark selected elements on stage-view
          // it is removed through dom-diff
          // this part is for when the selectedNodeUids is not changed cuz of the same code-format

          markSelectedElements(
            iframeRefRef.current,
            _selectedNodeUids,
            nodeTree,
          );
        }
      }

      // update prevFileUid
      if (prevFileUid !== currentFileUid) {
        dispatch(setPrevFileUid(currentFileUid));
      }
      if (fileData.ext === "html") {
        dispatch(setLoadingFalse());
      }

      dispatch(removeRunningAction());
    }
    updateFileContent();
  }, [currentFileContent, currentFileUid]);

  // expand nodes that need to be expanded when it's just select-event
  useEffect(() => {
    if (!isCurrentFileContentChanged.current) {
      const needToExpandItems = getNeedToExpandNodeUids(
        validNodeTree,
        selectedNodeUids,
      );
      if (activePanel === "node") return;
      dispatch(expandNodeTreeNodes(needToExpandItems));
    }
  }, [selectedNodeUids]);
};
