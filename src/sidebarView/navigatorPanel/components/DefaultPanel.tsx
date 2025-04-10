import React, { useMemo } from "react";
import { SVGIcon } from "@src/components";
import { RootNodeUid } from "@src/rnbwTSX";
import { useAppState } from "@_redux/useAppState";

import { getFileExtension, getFileNameFromPath, isHomeIcon } from "../helpers";
import { useNavigatorPanelHandlers } from "../hooks";

export const DefaultPanel = () => {
  const { project, fileTree, currentFileUid } = useAppState();

  const { filesReferenceData } = useAppState();

  const fileNode = useMemo(
    () => fileTree[currentFileUid],
    [fileTree, currentFileUid],
  );
  const fileName = useMemo(
    () => fileNode && getFileNameFromPath(fileNode),
    [fileNode],
  );
  const fileExtension = useMemo(
    () => fileNode && getFileExtension(fileNode),
    [fileNode],
  );

  const { onProjectClick, onFileClick } = useNavigatorPanelHandlers();

  return (
    <>
      <div className="gap-s align-center" onClick={onProjectClick}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            console.log("folder icon clicked");
          }}
        >
          <SVGIcon className="icon-xs" name="folder" />
        </div>
        <span
          className="text-s"
          style={{
            maxWidth: "60px",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {project.name}
        </span>
      </div>
      <span className="text-s opacity-m">/</span>

      {fileNode && fileNode.parentUid !== RootNodeUid && (
        <>
          <span className="text-s">...</span>
          <span className="text-s opacity-m">/</span>
        </>
      )}

      {fileNode && (
        <div className="gap-s align-center" onClick={onFileClick}>
          <SVGIcon
            className="icon-xs"
            name={
              isHomeIcon(fileNode)
                ? "home"
                : filesReferenceData[fileExtension] && fileExtension !== "md"
                  ? filesReferenceData[fileExtension].Icon
                  : "page"
            }
          />
          <span
            className="text-s"
            style={{
              width: "60px",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {fileName}
          </span>

          {fileNode && fileNode.data.changed && (
            <div
              className="radius-s foreground-primary"
              title="unsaved file"
              style={{ width: "6px", height: "6px" }}
            />
          )}
        </div>
      )}
    </>
  );
};
