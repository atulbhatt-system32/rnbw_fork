import { useEffect, useRef } from "react";

import { AddFileActionPrefix } from "@src/constants";
import { isAddFileAction } from "@_api/helpers";
import { useAppState } from "@_redux/useAppState";

import { useNodeActionsHandler } from "./useNodeActionsHandler";
import useRnbw from "@_services/useRnbw";

export const useCmdk = () => {
  const { activePanel, currentCommand } = useAppState();
  const rnbw = useRnbw();

  const activePanelRef = useRef(activePanel);

  const { onAdd } = useNodeActionsHandler();

  useEffect(() => {
    activePanelRef.current = activePanel;
  }, [activePanel]);
  useEffect(() => {
    if (!currentCommand) return;

    if (isAddFileAction(currentCommand.action)) {
      const type = currentCommand.action.slice(AddFileActionPrefix.length + 1);
      onAdd(type === "folder" ? true : false, type);
      return;
    }

    if (activePanelRef.current !== "file") return;

    switch (currentCommand.action) {
      case "Delete":
        rnbw.files.remove();
        break;
      case "Cut":
        rnbw.files.cutFiles();
        break;
      case "Copy":
        rnbw.files.copyFiles();
        break;
      case "Paste":
        rnbw.files.paste();
        break;
      case "Duplicate":
        rnbw.files.copyFiles();
        rnbw.files.paste();
        break;
      default:
        break;
    }
  }, [currentCommand]);
};
