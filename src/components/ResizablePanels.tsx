import React, { useState } from "react";
import { ResizablePanelsProps } from "../rnbw";
import { AppState } from "@src/_redux/store";
import { useSelector } from "react-redux";

const CODE_VIEW_WIDTH = "320px";
const ACTIONS_PANEL_WIDTH = "240px";

export default function ResizablePanels({
  sidebarView,
  designView,
  codeView,
}: ResizablePanelsProps) {
  const { showCodePanel, showTreePanel } = useSelector(
    (state: AppState) => state.global.panelsState,
  );

  const [isActionPanelHovered, setIsActionPanelHovered] = useState(false);
  const [isCodeViewHovered, setIsCodeViewHovered] = useState(false);

  const wrapperStyle: React.CSSProperties = {
    width: showTreePanel || isActionPanelHovered ? ACTIONS_PANEL_WIDTH : "2px",
    height: "100%",
    position: showTreePanel ? "relative" : "absolute",
    zIndex: 10,
  };

  const actionsPanelStyle: React.CSSProperties = {
    width: showTreePanel || isActionPanelHovered ? ACTIONS_PANEL_WIDTH : "0px",
    height: "100vh",
    transform:
      showTreePanel || isActionPanelHovered
        ? "translateX(0px)"
        : "translateX(-300px)",
  };

  const codeViewWrapperStyle: React.CSSProperties = {
    width: showCodePanel || isCodeViewHovered ? CODE_VIEW_WIDTH : "32px",
    height: "100vh",
    position: showCodePanel ? "relative" : "absolute",
    zIndex: 10,
    right: "0px",
  };

  const codeViewStyle: React.CSSProperties = {
    width: showCodePanel || isCodeViewHovered ? CODE_VIEW_WIDTH : "0px",
    height: "100%",
    right: "0px",
    zIndex: 10,
  };

  return (
    <div style={{ display: "flex", flexDirection: "row", height: "100%" }}>
      <div
        style={wrapperStyle}
        onMouseEnter={() => setIsActionPanelHovered(true)}
        onMouseLeave={() => setIsActionPanelHovered(false)}
      >
        <div style={actionsPanelStyle}>{sidebarView}</div>
      </div>

      {designView}
      <div
        style={codeViewWrapperStyle}
        onMouseEnter={() => setIsCodeViewHovered(true)}
        onMouseLeave={() => setIsCodeViewHovered(false)}
      >
        <div style={codeViewStyle}>{codeView}</div>
      </div>
    </div>
  );
}
