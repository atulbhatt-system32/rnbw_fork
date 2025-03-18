import "./rnbw.css";
import "@rnbws/renecss/dist/rene.min.css";
import "@rnbws/svg-icon.js";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import * as ReactDOMClient from "react-dom/client";
import { Provider, useDispatch } from "react-redux";
import { HashRouter as Router, Route, Routes } from "react-router-dom";
import { Workbox } from "workbox-window";
import persistStore from "redux-persist/es/persistStore";
import { PersistGate } from "redux-persist/integration/react";

import { store } from "@src/_redux/store";
import { Loader } from "@src/components";
import { ActionsPanel, CodeView, DesignView } from "./rnbw";
import { isUnsavedProject } from "@_api/file";
import { MainContext } from "@_redux/main";
import { setCurrentCommand } from "@_redux/main/cmdk";
import { useAppState } from "@_redux/useAppState";

import { useCmdk, useHandlers, useReferneces } from "@src/hooks";
import Processor from "@src/processor";
import ResizablePanels from "@_components/ResizablePanels";
import { debounce } from "@src/helper";
import { CommandDialog } from "@src/commandMenu/CommandDialog";
import { TNodeUid, TValidNodeUid } from "@_api/index";
import NotificationContainer from "@src/features/notification";
import { initRnbwServices } from "./services/rnbw.services";
import { CodeViewSyncDelay, LogAllow } from "./constants";
import globalService from "./services/global.service";
import projectService from "./services/project.service";
import { MonacoEditorProvider } from "./context/editor.context";
import { useMonacoEditor } from "./context/editor.context";
// Constants

function MainPage() {
  const dispatch = useDispatch();
  const { currentFileUid, fileTree, autoSave, cmdkReferenceData } =
    useAppState();

  const { iframeRefRef, setIframeRefRef } = useReferneces();

  const { importProject, closeNavigator, reloadCurrentProject } = useHandlers();
  const { onNew, onUndo, onRedo, onClear, onJumpstart } = useCmdk({
    cmdkReferenceData,
    importProject,
  });

  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const prevFocusedElement = React.useRef<HTMLElement | null>(
    window.document.activeElement as HTMLElement | null,
  );
  const maxNodeUidRef = React.useRef<TValidNodeUid>(0);
  const setMaxNodeUidRef = (maxNodeUid: TValidNodeUid) => {
    if (typeof maxNodeUid === "number") {
      if (maxNodeUid > (maxNodeUidRef.current as number)) {
        maxNodeUidRef.current = maxNodeUid;
      }
    }
  };

  const contentEditableUidRef = React.useRef<TNodeUid>("");
  const setContentEditableUidRef = (uid: TNodeUid) => {
    contentEditableUidRef.current = uid;
  };

  const INTERVAL_TIMER = 2000;

  const debouncedCurrentProjectReload = useCallback(() => {
    debounce(reloadCurrentProject, CodeViewSyncDelay)();
  }, [fileTree, currentFileUid, autoSave]);

  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === "visible") {
      fileTree[currentFileUid]?.data?.changed
        ? autoSave && dispatch(setCurrentCommand({ action: "Save" }))
        : debouncedCurrentProjectReload();
    }
  }, [fileTree, currentFileUid, debouncedCurrentProjectReload, autoSave]);

  const handleBlurChange = useCallback(() => {
    if (
      !window.document.activeElement?.isEqualNode(prevFocusedElement.current)
    ) {
      return;
    }
    intervalRef.current = setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        !fileTree[currentFileUid]?.data?.changed
      ) {
        if (
          !window.document.activeElement?.isEqualNode(
            prevFocusedElement.current,
          )
        ) {
          intervalRef.current && clearInterval(intervalRef.current);
          return;
        }
        debouncedCurrentProjectReload();
      }
    }, INTERVAL_TIMER);
  }, [fileTree, currentFileUid, debouncedCurrentProjectReload]);

  const handleFocusChange = useCallback(() => {
    if (intervalRef.current) {
      prevFocusedElement.current = window.document.activeElement as HTMLElement;
      clearInterval(intervalRef.current);
    }
  }, []);

  const handleOnWheel = (event: WheelEvent) => {
    if (event.ctrlKey) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const addEventListeners = useCallback(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("wheel", handleOnWheel, { passive: false });
    window.addEventListener("blur", handleBlurChange);
    window.addEventListener("focus", handleFocusChange);
    const contentWindow = iframeRefRef.current?.contentWindow;
    if (contentWindow) {
      contentWindow.addEventListener("focus", handleFocusChange);
      contentWindow.addEventListener("blur", handleBlurChange);
    }
  }, [
    handleVisibilityChange,
    handleFocusChange,
    handleBlurChange,
    iframeRefRef,
  ]);

  const removeEventListeners = useCallback(() => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    document.removeEventListener("wheel", handleOnWheel);
    window.removeEventListener("blur", handleBlurChange);
    window.removeEventListener("focus", handleFocusChange);
    const contentWindow = iframeRefRef.current?.contentWindow;
    if (contentWindow) {
      contentWindow.removeEventListener("focus", handleFocusChange);
      contentWindow.removeEventListener("blur", handleBlurChange);
    }
  }, [
    handleVisibilityChange,
    handleFocusChange,
    handleBlurChange,
    iframeRefRef,
  ]);

  useEffect(function init() {
    globalService.initRnbw();
    if (globalService.isUserNewbie()) {
      onNew();
    } else {
      projectService.loadDefaultProject();
    }
  }, []);
  useEffect(() => {
    window.onbeforeunload = isUnsavedProject(fileTree) ? () => "changed" : null;
    return () => {
      window.onbeforeunload = null;
    };
  }, [fileTree]);

  useEffect(() => {
    addEventListeners();
    return () => {
      removeEventListeners();
    };
  }, [addEventListeners, removeEventListeners]);

  return (
    <>
      <MainContext.Provider
        value={{
          maxNodeUidRef,
          setMaxNodeUidRef,
          contentEditableUidRef,
          setContentEditableUidRef,
          iframeRefRef,
          setIframeRefRef,
          importProject,
          reloadCurrentProject,
          onUndo,
          onRedo,
        }}
      >
        <Processor></Processor>
        <div
          id="MainPage"
          className={"view background-primary"}
          style={{ display: "relative" }}
          onClick={closeNavigator}
        >
          <Loader />
          <ResizablePanels
            sidebarView={<ActionsPanel />}
            designView={<DesignView />}
            codeView={<CodeView />}
          />
        </div>
        <CommandDialog onClear={onClear} onJumpstart={onJumpstart} />
      </MainContext.Provider>
    </>
  );
}

function App() {
  const [nohostReady, setNohostReady] = useState(false);
  const { isEditorReady } = useMonacoEditor();
  useEffect(() => {
    // Initialize extension bridge
    initRnbwServices();

    // Rest of your initialization code
    if ("serviceWorker" in navigator) {
      const wb = new Workbox("/nohost-sw.js?route=rnbw");
      wb.register().then(() => {
        setNohostReady(true);
        LogAllow && console.log("nohost ready");
      });
      window.location.href = "/#";
    }
  }, []);

  return useMemo(
    () => (
      <>
        {isEditorReady && <NotificationContainer />}
        {nohostReady && (
          <Router>
            <Routes>
              <Route path="/" element={<MainPage />} />
              <Route path="/:project/*" element={<MainPage />} />
            </Routes>
          </Router>
        )}
      </>
    ),
    [nohostReady, isEditorReady],
  );
}

// configure store
const persistor = persistStore(store);

// render #root
const root = ReactDOMClient.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <MonacoEditorProvider>
        <App />
      </MonacoEditorProvider>
    </PersistGate>
  </Provider>,
);

export default App;
