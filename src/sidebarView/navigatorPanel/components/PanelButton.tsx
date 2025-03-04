import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { setActivePanel } from "@_redux/main/processor";
import { AppState } from "@src/_redux/store";
import { setShowTreePanel } from "@src/_redux/global";

export const PanelButton = () => {
  const dispatch = useDispatch();
  const { showTreePanel } = useSelector(
    (state: AppState) => state.global.panelsState,
  );

  return (
    <div
      style={{ display: "none" }}
      onClick={(e) => {
        e.stopPropagation();
        dispatch(setShowTreePanel(!showTreePanel));
        dispatch(setActivePanel("none"));
      }}
    />
  );
};
