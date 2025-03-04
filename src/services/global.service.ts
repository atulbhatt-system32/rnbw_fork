import { store } from "@src/_redux/store";
import { setPanelsState } from "@src/_redux/global";

function togglePanels(panelsState: {
  showCodePanel: boolean;
  showTreePanel: boolean;
}) {
  const { showCodePanel, showTreePanel } = panelsState;
  const isAnyPanelOpen = showCodePanel || showTreePanel;

  if (isAnyPanelOpen) {
    // close all panels
    store.dispatch(
      setPanelsState({
        showCodePanel: false,
        showTreePanel: false,
        focusedPanel: "design",
      }),
    );

    // focus on stage
    const iframe: HTMLIFrameElement | null = document.getElementById(
      "iframeId",
    ) as HTMLIFrameElement;
    if (iframe) {
      const contentWindow = iframe.contentWindow;
      if (contentWindow) {
        contentWindow.focus();
      }
    }
  } else {
    // open all panels
    store.dispatch(
      setPanelsState({
        showCodePanel: true,
        showTreePanel: true,
        focusedPanel: "design",
      }),
    );
  }
}

export default { togglePanels };
