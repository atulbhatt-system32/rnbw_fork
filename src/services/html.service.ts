import { RootNodeUid } from "@src/constants";
import { parse } from "parse5";
import { Document } from "parse5/dist/tree-adapters/default";
import { notify } from "./notificationService";
import { TreeNodeData, TreeStructure, HtmlNode } from "@src/types/html.types";
import { RnbwEditableNodeAttr, StageNodeIdAttr } from "@src/constants";

//@ts-expect-error - allow importing idiomorph
import Idiomorph from "idiomorph";

function parseHtml(html: string) {
  const document = parse(html, {
    sourceCodeLocationInfo: true,
  });
  return document;
}

let maxNodeUid = 0; // Initialize the counter for unique IDs

function generateUniqueNodeId(node: Element): string {
  /* This is to ensure that the html node is always the first node */
  if (node.nodeName === "html") {
    maxNodeUid = 0;
  }
  return `${node.nodeName}${++maxNodeUid}`;
}

function createNodeTree(document: Document): {
  complexNodeTree: TreeStructure;
  document: Document | null;
} {
  //find the root node
  const rootNode = document.childNodes.find(
    (node) => node.nodeName === "html",
  ) as unknown as Element;
  if (!rootNode) {
    notify.info("error", "Root node not found");
    return {
      complexNodeTree: {},
      document: null,
    };
  }

  //create complex-tree-template
  const complexTreeTemplate: TreeStructure = {
    [RootNodeUid]: {
      canRename: false,
      canMove: false,
      children: [],
      isFolder: true,
      index: RootNodeUid,
      data: {
        nodeName: RootNodeUid,
        attributes: [],
        parentId: "",
      },
    },
  };

  const complexNodeTree: TreeStructure = {
    [RootNodeUid]: {
      canRename: false,
      canMove: false,
      children: [],
      isFolder: true,
      index: RootNodeUid,
      data: {
        nodeName: RootNodeUid,
        attributes: [],
        parentId: "",
      },
    },
  };
  //traverse the root node
  function traverseNode(
    node: HtmlNode,
    currentNode: TreeNodeData,
    parentId: string,
  ) {
    // Skip text nodes that only contain whitespace
    if (node.nodeName === "#text") {
      const textContent = (node as unknown as Text).wholeText || "";
      if (!textContent.trim()) {
        return; // Skip empty text nodes
      }
    }

    const nodeUid = generateUniqueNodeId(node);

    currentNode.children.push(nodeUid);
    complexNodeTree[parentId].children.push(nodeUid);

    const attributes = [];
    if (node.attrs) {
      for (const attr of node.attrs) {
        attributes.push({
          [attr.name]: attr.value,
        });
      }
      node.attrs.push({
        name: StageNodeIdAttr,
        value: nodeUid,
      });
    }

    // Check if node only has text children
    const hasOnlyTextChildren =
      node.childNodes &&
      node.childNodes.length > 0 &&
      Array.from(node.childNodes).every((child) => child.nodeName === "#text");

    //@ts-expect-error - allow indexing with a string
    currentNode[nodeUid] = {
      canMove: false,
      canRename: false,
      children: [],
      isFolder:
        node.childNodes && node.childNodes.length > 0 && !hasOnlyTextChildren,
      index: nodeUid,
      data: {
        nodeName: node.nodeName,
        attributes,
        parentId,
      },
    };
    complexNodeTree[nodeUid] = {
      canMove: false,
      canRename: false,
      children: [],
      isFolder:
        node.childNodes && node.childNodes.length > 0 && !hasOnlyTextChildren,
      index: nodeUid,
      data: {
        nodeName: node.nodeName,
        attributes,
        parentId,
      },
    };
    if (node && node.childNodes && node.childNodes.length > 0) {
      node.childNodes.forEach((child) => {
        traverseNode(
          child as unknown as HtmlNode,
          //@ts-expect-error - allow indexing with a string
          currentNode[nodeUid],
          nodeUid,
        );
      });
    }
  }

  traverseNode(
    rootNode as unknown as HtmlNode,
    complexTreeTemplate[RootNodeUid],
    RootNodeUid,
  );

  return {
    complexNodeTree,
    document,
  };
}

function getInitialExpandedNodesFromNodeTree(nodeTree: TreeStructure) {
  const htmlNodeUid = Object.keys(nodeTree).find((key) =>
    key.toLowerCase().startsWith("html"),
  );
  const bodyNodeUid = Object.keys(nodeTree).find((key) =>
    key.toLowerCase().startsWith("body"),
  );
  const initialExpandedNodes: string[] = [];
  initialExpandedNodes.push(RootNodeUid);

  if (htmlNodeUid && bodyNodeUid) {
    initialExpandedNodes.push(htmlNodeUid);
    initialExpandedNodes.push(bodyNodeUid);
  }
  return initialExpandedNodes;
}

function scrollToElement(uid: string) {
  const iframe = document.getElementById("iframeId") as HTMLIFrameElement;
  const element = iframe?.contentWindow?.document?.querySelector(
    `[${StageNodeIdAttr}="${uid}"]`,
  );
  if (element) {
    element.scrollIntoView({
      block: "nearest",
      inline: "start",
      behavior: "auto",
    });
  }
}

function checkIsNodeWebComponent(nodeId: string): boolean {
  const iframe = document.getElementById("iframeId") as HTMLIFrameElement;
  const element = iframe?.contentWindow?.document?.querySelector(
    `[${StageNodeIdAttr}="${nodeId}"]`,
  );
  // Check if element name contains a hyphen (standard convention for custom elements)
  const hasHyphen = nodeId.includes("-");

  // Check if element has a shadow root (another key characteristic of many web components)
  if (!element) {
    return false;
  }
  const hasShadowRoot = !!element.shadowRoot;

  // Check if element is registered as a custom element
  const isCustomElement =
    customElements.get(element.tagName.toLowerCase()) !== undefined;

  return hasHyphen || hasShadowRoot || isCustomElement;
}

function clearSelectedElements() {
  const iframe = document.getElementById("iframeId") as HTMLIFrameElement;
  const selectedElements = iframe?.contentWindow?.document.querySelectorAll(
    `[rnbwdev-rnbw-element-select]`,
  );
  selectedElements?.forEach((ele) => {
    ele.removeAttribute("rnbwdev-rnbw-element-select");
  });
}

function clearHoveredElements(hoveredElement?: Element) {
  const iframe = document.getElementById("iframeId") as HTMLIFrameElement;
  const hoveredElements = iframe?.contentWindow?.document.querySelectorAll(
    `[rnbwdev-rnbw-element-hover]`,
  );
  hoveredElements?.forEach((ele) => {
    if (
      hoveredElement &&
      ele.getAttribute("rnbwdev-rnbw-element-hover") ===
        hoveredElement.getAttribute("rnbwdev-rnbw-element-hover")
    ) {
      return;
    }
    ele.removeAttribute("rnbwdev-rnbw-element-hover");
  });
}

function markSelectedElements(uids: string[]) {
  //find all the elements which are already selected and make them unselected
  const iframe = document.getElementById("iframeId") as HTMLIFrameElement;
  clearSelectedElements();

  uids.map((uid) => {
    // if it's a web component, should select its first child element
    let selectedElement = iframe?.contentWindow?.document?.querySelector(
      `[${StageNodeIdAttr}="${uid}"]`,
    );

    //check if the element is a web component
    const isWebComponent = checkIsNodeWebComponent(uid);
    if (isWebComponent) {
      selectedElement = selectedElement?.firstElementChild;
    }

    selectedElement?.setAttribute("rnbwdev-rnbw-element-select", "");
  });
}

function markHoveredElement(uid: string) {
  const iframe = document.getElementById("iframeId") as HTMLIFrameElement;
  // clearHoveredElements();
  // if it's a web component, should select its first child element
  const hoveredElement = iframe?.contentWindow?.document?.querySelector(
    `[${StageNodeIdAttr}="${uid}"]`,
  );
  if (hoveredElement) {
    clearHoveredElements(hoveredElement);
    hoveredElement?.setAttribute("rnbwdev-rnbw-element-hover", "");
  }
}

function makeNodeEditable(uid: string, clickX?: number, clickY?: number) {
  const iframe = document.getElementById("iframeId") as HTMLIFrameElement;
  const element = iframe?.contentWindow?.document?.querySelector(
    `[${StageNodeIdAttr}="${uid}"]`,
  );

  if (element) {
    element.setAttribute("contenteditable", "true");
    element.setAttribute("rnbwdev-rnbw-editable", "");

    // Cast to HTMLElement to access focus method
    (element as HTMLElement).focus();

    // If click coordinates are provided, position the cursor at that point
    if (clickX !== undefined && clickY !== undefined && iframe?.contentWindow) {
      const document = iframe.contentWindow.document;

      // Create a range from the point where user clicked
      const range = document.caretRangeFromPoint(clickX, clickY);

      if (range) {
        // Create a selection and set the range
        const selection = document.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }
  }
}

function makeNodeNonEditable(uid: string) {
  const iframe = document.getElementById("iframeId") as HTMLIFrameElement;
  const element = iframe?.contentWindow?.document?.querySelector(
    `[${StageNodeIdAttr}="${uid}"]`,
  );
  if (element) {
    element.removeAttribute("contenteditable");
    element.removeAttribute("rnbwdev-rnbw-editable");
  }
}

function findAndGetAllEditableNodes() {
  const iframe = document.getElementById("iframeId") as HTMLIFrameElement;
  const elements = iframe?.contentWindow?.document.querySelectorAll(
    `[${RnbwEditableNodeAttr}]`,
  );
  return elements;
}

function makeAllEditableNodesNonEditable() {
  const elements = findAndGetAllEditableNodes();
  if (elements) {
    elements.forEach((element) => {
      element.removeAttribute("contenteditable");
      element.removeAttribute("rnbwdev-rnbw-editable");
    });
  }
}

function updateIframe(updatedHtml: string) {
  const iframe = document.getElementById("iframeId") as HTMLIFrameElement;
  if (iframe) {
    const iframeDoc = iframe.contentDocument;
    if (!iframeDoc) {
      console.error("Iframe document not found");
      return;
    }
    const htmlElement = iframeDoc.getElementsByTagName("html")[0];
    if (!htmlElement) {
      console.error("HTML element not found");
      return;
    }
    const parser = new DOMParser();
    const newDoc = parser.parseFromString(updatedHtml, "text/html");
    const newContent = newDoc.documentElement;

    Idiomorph.morph(htmlElement, newContent.innerHTML, {
      morphStyle: "innerHTML",
      head: { style: "morph" },
      callbacks: {
        beforeNodeRemoved: (node: Element) => {
          if (node.hasAttribute("im-preserve")) {
            return false;
          }
          return true;
        },
        beforeNodeMorphed: (oldNode: Element, newNode: Node) => {
          if (newNode instanceof HTMLElement && newNode.tagName.includes("-")) {
            return false;
          }
          return true;
        },
      },
    });
  }
}

export default {
  parseHtml,
  createNodeTree,
  getInitialExpandedNodesFromNodeTree,
  markSelectedElements,
  markHoveredElement,
  scrollToElement,
  makeNodeEditable,
  makeNodeNonEditable,
  checkIsNodeWebComponent,
  makeAllEditableNodesNonEditable,
  findAndGetAllEditableNodes,
  updateIframe,
};
