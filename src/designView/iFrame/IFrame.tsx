import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useDispatch, useSelector } from "react-redux";

import { LogAllow } from "@src/rnbwTSX";
import { TNodeTreeData, TNodeUid } from "@_api/types";
import { MainContext } from "@_redux/main";
import { setIframeLoading } from "@_redux/main/designView";
import { useAppState } from "@_redux/useAppState";

import { jss, styles } from "./constants";
import { markSelectedElements } from "./helpers";
import { useCmdk, useMouseEvents, useSyncNode } from "./hooks";

import { debounce } from "lodash";
import eventEmitter from "@src/services/eventEmitter";
import { AppState } from "@src/_redux/_root";
import { ProjectEvent } from "@src/types";

type AppStateReturnType = ReturnType<typeof useAppState>;
export interface eventListenersStatesRefType extends AppStateReturnType {
  iframeRefState: HTMLIFrameElement | null;
  iframeRefRef: React.MutableRefObject<HTMLIFrameElement | null>;
  nodeTreeRef: React.MutableRefObject<TNodeTreeData>;
  contentEditableUidRef: React.MutableRefObject<TNodeUid>;
  isEditingRef: React.MutableRefObject<boolean>;
  hoveredItemRef: React.MutableRefObject<TNodeUid>;
  selectedItemsRef: React.MutableRefObject<TNodeUid[]>;
  hoveredTargetRef: React.MutableRefObject<EventTarget | null>;
}

export const IFrame = () => {
  const [iframeRefState, setIframeRefState] =
    useState<HTMLIFrameElement | null>(null);
  const [document, setDocument] = useState<Document | string | undefined>("");

  const isEditingRef = useRef(false);
  const dispatch = useDispatch();
  const appState: AppStateReturnType = useAppState();
  const { nodeTree, project, validNodeTree, renderableFileUid } = appState;
  const currentPagePreviewUrl = useSelector(
    (state: AppState) => state.main.currentPage.previewUrl,
  );
  const { iframeRefRef, setIframeRefRef, contentEditableUidRef } =
    useContext(MainContext);
  // hooks
  const { nodeTreeRef, hoveredItemRef, selectedItemsRef } =
    useSyncNode(iframeRefState);
  const hoveredTargetRef = useRef(null);
  const eventListenersStatesRef = useRef<eventListenersStatesRefType>({
    ...appState,
    iframeRefState,
    iframeRefRef,
    nodeTreeRef,
    contentEditableUidRef,
    isEditingRef,
    hoveredItemRef,
    selectedItemsRef,
    hoveredTargetRef,
  });

  const { onKeyDown, onKeyUp, handlePanelsToggle } = useCmdk();
  const {
    onMouseEnter,
    onMouseMove,
    onMouseLeave,
    onClick,
    onDblClick,
    onMouseOver,
  } = useMouseEvents();

  useEffect(() => {
    const reloadIframeSrc = () => {
      if (iframeRefState?.contentWindow) {
        try {
          const currentSrc = iframeRefState.src;

          /*
          iframeSrc is the src of the iframe in the redux store
          currentSrc is the src of the iframe in the html
          */
          if (currentPagePreviewUrl && currentSrc !== currentPagePreviewUrl) {
            iframeRefState.src = currentPagePreviewUrl;
          } else {
            // Force reload by resetting the same src
            iframeRefState.src = currentSrc;
          }
        } catch (error) {
          console.error("Iframe reload failed:", error);
        }
      }
    };

    const debouncedReloadIframe = debounce(reloadIframeSrc, 150);

    const handleProjectEvent = (projectEvent: ProjectEvent) => {
      if (projectEvent.type === "reloadPage") {
        debouncedReloadIframe();
      }
    };

    eventEmitter.on("project", handleProjectEvent);

    return () => {
      eventEmitter.off("project", handleProjectEvent);
      debouncedReloadIframe.cancel();
    };
  }, [iframeRefState, currentPagePreviewUrl, dispatch]);

  const addHtmlNodeEventListeners = useCallback(
    (htmlNode: HTMLElement) => {
      //NOTE: all the values required for the event listeners are stored in the eventListenersStatesRef because the event listeners are not able to access the latest values of the variables due to the closure of the event listeners

      // enable cmdk
      htmlNode.addEventListener("keydown", (e: KeyboardEvent) => {
        //handlePanelsToggle should be called before onKeyDown as on onKeyDown the contentEditiable editing is set to false and the panels are toggled. But we don't need to toggle the panels if the user is editing the contentEditable
        handlePanelsToggle(e, eventListenersStatesRef);
        onKeyDown(e, eventListenersStatesRef);
        // to ensure that the events between the iframe and the document are executed sequentially and smoothly, we use the postMessage function
        window.parent.postMessage(
          { type: "keydown", key: e.key, code: e.code },
          "*",
        );
      });

      htmlNode.addEventListener("mouseenter", () => {
        onMouseEnter();
      });
      htmlNode.addEventListener("mousemove", (e: MouseEvent) => {
        onMouseMove(e, eventListenersStatesRef);
        window.parent.postMessage(
          { type: "mousemove", movementX: e.movementX, movementY: e.movementY },
          "*",
        );
      });
      htmlNode.addEventListener("mouseleave", () => {
        onMouseLeave();
      });

      htmlNode.addEventListener("mouseover", (e: MouseEvent) => {
        onMouseOver(e, eventListenersStatesRef);
      });
      htmlNode.addEventListener("click", (e: MouseEvent) => {
        e.preventDefault();
        onClick(e, eventListenersStatesRef);
      });
      htmlNode.addEventListener("dblclick", (e: MouseEvent) => {
        e.preventDefault();
        onDblClick(e, eventListenersStatesRef);
      });
      htmlNode.addEventListener("keyup", (e: KeyboardEvent) => {
        e.preventDefault();
        onKeyUp(e, eventListenersStatesRef);
      });
      htmlNode.addEventListener(
        "wheel",
        (event: WheelEvent) => {
          if (event.ctrlKey) {
            event.preventDefault(); // Prevent default zoom behavior
          }
          window.parent.postMessage(
            {
              type: "wheel",
              deltaX: event.deltaX,
              deltaY: event.deltaY,
              ctrlKey: event.ctrlKey,
              metaKey: event.metaKey,
            },
            "*",
          );
        },
        { passive: false },
      );
      htmlNode.addEventListener("mousedown", (event) => {
        window.parent.postMessage(
          { type: "mousedown", which: event.which },
          "*",
        );
      });
      htmlNode.addEventListener("mouseup", (event) => {
        window.parent.postMessage({ type: "mouseup", which: event.which }, "*");
      });
    },
    [
      onKeyDown,
      onMouseEnter,
      onMouseMove,
      onMouseLeave,
      onClick,
      onDblClick,
      onKeyUp,
    ],
  );

  const isIframeLoaded = useCallback(() => {
    if (!iframeRefState) return;
    const _document = iframeRefState.contentWindow?.document;
    if (_document?.readyState === "complete") {
      return true;
    } else {
      isIframeLoaded();
    }
  }, [iframeRefState]);
  const iframeOnload = useCallback(() => {
    LogAllow && console.log("iframe loaded");

    const _document = iframeRefState?.contentWindow?.document;
    const htmlNode = _document?.documentElement;
    const headNode = _document?.head;
    setDocument(_document);
    if (htmlNode && headNode) {
      setIframeLoading(true);
      // add rnbw css
      const style = _document.createElement("style");
      style.setAttribute("im-preserve", "true");
      style.textContent = styles;
      headNode.appendChild(style);

      // add image-validator js
      const js = _document.createElement("script");
      js.setAttribute("image-validator", "true");
      js.textContent = jss;
      headNode.appendChild(js);

      // define event handlers
      addHtmlNodeEventListeners(htmlNode);

      // disable contextmenu
      _document.addEventListener("contextmenu", (e: MouseEvent) => {
        e.preventDefault();
      });
      if (isIframeLoaded()) {
        dispatch(setIframeLoading(false));
      }
    }

    // mark selected elements on load
    markSelectedElements(iframeRefState, selectedItemsRef.current, nodeTree);
    iframeRefState?.focus();
    dispatch(setIframeLoading(false));
  }, [
    iframeRefState,
    addHtmlNodeEventListeners,
    selectedItemsRef,
    nodeTree,
    dispatch,
    project,
  ]);

  // init iframe
  useEffect(() => {
    setIframeRefRef(iframeRefState);
    if (iframeRefState) {
      iframeRefState.onload = iframeOnload;
    }
    return () => {
      // Cleanup function to remove event listener
      if (iframeRefState) {
        iframeRefState.onload = null;
      }
    };
  }, [iframeRefState]);

  useEffect(() => {
    if (iframeRefState && document) {
      const iframeDocument = document as Document;
      if (!iframeDocument) return;

      const wrapTextNodes = (element: HTMLElement) => {
        const childNodes = element.childNodes;

        for (let i = 0; i < childNodes.length; i++) {
          const node = childNodes[i];
          if (!node) continue;

          if (node.nodeType === Node.TEXT_NODE) {
            const nodeValue = node.nodeValue?.replace(/[\n\s]/g, "");

            if (!nodeValue) continue;

            const span = iframeDocument.createElement("span");
            const text = iframeDocument.createTextNode(node.nodeValue || "");
            const uid = element.getAttribute("data-rnbw-stage-node-id");

            if (!uid) continue;

            const nodeChildren = validNodeTree[uid]?.children;
            const filterArr = nodeChildren?.filter(
              (uid) => validNodeTree[uid]?.data?.textContent == node.nodeValue,
            );

            if (!filterArr || !filterArr.length) {
              element.setAttribute("rnbw-text-element", "true");

              continue;
            }

            span.appendChild(text);
            span.setAttribute("rnbw-text-element", "true");
            const stageUid = filterArr?.length ? filterArr[0] : i;

            span.setAttribute("data-rnbw-stage-node-id", `${stageUid}`);
            if (selectedItemsRef.current.includes(`${stageUid}`)) {
              span.setAttribute("rnbwdev-rnbw-element-select", "true");
            }
            node.parentNode?.replaceChild(span, node);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            wrapTextNodes(node as HTMLElement);
          }
        }
      };

      wrapTextNodes(iframeDocument.body);
    }
  }, [iframeRefState, document, validNodeTree, selectedItemsRef.current]);

  useEffect(() => {
    eventListenersStatesRef.current = {
      ...appState,
      iframeRefState,
      iframeRefRef,
      nodeTreeRef,
      contentEditableUidRef,
      isEditingRef,
      hoveredItemRef,
      selectedItemsRef,
      hoveredTargetRef,
    };
  }, [
    iframeRefState,
    iframeRefRef.current,
    nodeTreeRef.current,
    contentEditableUidRef.current,
    isEditingRef.current,
    hoveredItemRef.current,
    selectedItemsRef.current,
    appState,
  ]);

  return useMemo(() => {
    return (
      <>
        {currentPagePreviewUrl && (
          <iframe
            key={renderableFileUid}
            ref={setIframeRefState}
            id={"iframeId"}
            src={currentPagePreviewUrl}
            style={{
              background: "white",
              width: "100%",
              height: "100%",
            }}
          />
        )}
      </>
    );
  }, [currentPagePreviewUrl]);
};
