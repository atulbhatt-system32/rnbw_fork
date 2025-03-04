import React, { useMemo } from "react";

import NavigatorPanel from "./navigatorPanel";
import NodeTreeView from "./nodeTreeView";
import SettingsPanel from "./settingsPanel";
import WorkspaceTreeView from "./workspaceTreeView";

import { useAppState } from "@_redux/useAppState";
import { getFileExtension } from "./navigatorPanel/helpers";
import { AppState } from "@src/_redux/store";
import { useSelector } from "react-redux";

export default function ActionsPanel() {
  const { selectedNodeUids, currentFileUid, fileTree } = useAppState();
  const { showFileTree } = useSelector(
    (state: AppState) => state.global.panelsState,
  );

  const isCurrentFileHtml = useMemo(() => {
    const fileNode = fileTree[currentFileUid];
    return fileNode && getFileExtension(fileNode) === "html";
  }, [fileTree, currentFileUid]);

  const isSettingsPanelVisible =
    selectedNodeUids.length == 1 && isCurrentFileHtml;

  return useMemo(() => {
    return (
      <div
        id="ActionsPanel"
        className="border-right background-primary"
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: isSettingsPanelVisible
            ? "space-between"
            : "flex-start",
          height: "100%",
        }}
      >
        <NavigatorPanel />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: showFileTree
              ? isSettingsPanelVisible
                ? "20%"
                : "95%"
              : "0%",
          }}
        >
          <WorkspaceTreeView />
        </div>
        {isCurrentFileHtml && <NodeTreeView />}

        {isSettingsPanelVisible && <SettingsPanel />}
      </div>
    );
  }, [showFileTree, selectedNodeUids, isCurrentFileHtml]);
}
