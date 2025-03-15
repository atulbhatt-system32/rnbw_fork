import useRnbw from "@_services/useRnbw";
import { Range } from "monaco-editor";
import { diff_match_patch } from "diff-match-patch";

import { sortUidsByMaxEndIndex } from "@src/sidebarView/nodeTreeView/helpers";
import { useAppState } from "@_redux/useAppState";
import { PrettyCode, useElementHelper } from "@_services/useElementsHelper";
import { useSelector } from "react-redux";
import { AppState } from "@src/_redux/store";

export default function useFormatCode() {
  const { validNodeTree } = useAppState();
  const editorInstance = useSelector(
    (state: AppState) => state.main.editor.editorInstance,
  );
  const { setEditorModelValue, getEditorModelWithCurrentCode } =
    useElementHelper();

  const rnbw = useRnbw();

  async function formatCode() {
    const codeViewInstanceModel = editorInstance?.getModel();
    if (!codeViewInstanceModel) return;

    const helperModel = getEditorModelWithCurrentCode();
    const selectedElements = rnbw.elements.getSelectedElements();
    const sortedUids = sortUidsByMaxEndIndex(selectedElements, validNodeTree);
    const dmp = new diff_match_patch();

    await Promise.all(
      sortedUids.map(async (uid) => {
        const node = rnbw.elements.getElement(uid);
        if (!node) return null;

        const { startLine, startCol, endLine, endCol } =
          node.data.sourceCodeLocation;
        const range = new Range(startLine, startCol, endLine, endCol);
        const code = codeViewInstanceModel.getValueInRange(range);
        const formattedCode = await PrettyCode({ code, startCol });

        // Compute the diff
        const diffs = dmp.diff_main(code, formattedCode);
        dmp.diff_cleanupSemantic(diffs);

        // Generate Monaco edits from the diffs
        let currentPosition = range.getStartPosition();

        diffs.forEach((diff) => {
          const [operation, text] = diff;
          if (operation === 0) {
            // No change
            currentPosition = helperModel.modifyPosition(
              currentPosition,
              text.length,
            );
          } else if (operation === -1) {
            // Delete text
            const endPosition = helperModel.modifyPosition(
              currentPosition,
              text.length,
            );
            helperModel.applyEdits([
              {
                range: new Range(
                  currentPosition.lineNumber,
                  currentPosition.column,
                  endPosition.lineNumber,
                  endPosition.column,
                ),
                text: "",
              },
            ]);
          } else if (operation === 1) {
            // Insert text
            helperModel.applyEdits([
              {
                range: new Range(
                  currentPosition.lineNumber,
                  currentPosition.column,
                  currentPosition.lineNumber,
                  currentPosition.column,
                ),
                text,
              },
            ]);
            currentPosition = helperModel.modifyPosition(
              currentPosition,
              text.length,
            );
          }
        });
      }),
    );

    setEditorModelValue(helperModel, codeViewInstanceModel);
  }

  const config = {
    name: "Format Code",
    action: formatCode,
    description: "Format selected elements code",
    shortcuts: ["cmd+shift+f"],
  };

  return config;
}
