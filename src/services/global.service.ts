import { store } from "@src/_redux/store";
import { setPanelsState, setOsType, setTheme } from "@src/_redux/global";
import { BrowserUnsupportedMessage } from "@src/constants";
import { TTheme } from "@src/types";

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

function setOs() {
  if (navigator.userAgent.indexOf("Mac OS X") !== -1) {
    store.dispatch(setOsType("Mac"));
  } else if (navigator.userAgent.indexOf("Linux") !== -1) {
    store.dispatch(setOsType("Linux"));
  } else {
    store.dispatch(setOsType("Windows"));
  }
}

function isChromeOrEdge() {
  const userAgent = navigator.userAgent;
  if (userAgent.indexOf("Chrome") > -1) {
    return true;
  } else if (userAgent.indexOf("Edg") > -1) {
    return true;
  }
  return false;
}

function disableContextMenu() {
  if (isChromeOrEdge()) {
    document.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });
    window.document.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });
  } else {
    if (!window.confirm(BrowserUnsupportedMessage)) return;
  }
}

function setRnbwTheme() {
  const theme = localStorage.getItem("theme");
  if (theme) {
    document.documentElement.setAttribute("data-theme", theme);
    store.dispatch(setTheme(theme as TTheme));
  } else {
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      document.documentElement.setAttribute("data-theme", "dark");
      store.dispatch(setTheme("dark"));
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      store.dispatch(setTheme("light"));
      localStorage.setItem("theme", "light");
    }
  }
}

function isUserNewbie() {
  const newbie = localStorage.getItem("newbie");
  const isNewbie = newbie === null ? true : false;

  if (!isNewbie) {
    localStorage.setItem("newbie", "false");
  }
  return isNewbie;
}

function resetUrlHistory() {
  window.history.replaceState(null, "", "/");
}

function initRnbw() {
  setOs();
  disableContextMenu();
  setRnbwTheme();
  resetUrlHistory();
}

export default {
  togglePanels,
  setOs,
  disableContextMenu,
  setRnbwTheme,
  initRnbw,
  isUserNewbie,
  resetUrlHistory,
};
