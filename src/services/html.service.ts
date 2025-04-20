import {
  HoverableAttribute,
  RnbwEditableNodeAttr,
  RootNodeUid,
  StageNodeIdAttr,
} from "@src/constants";
import { HtmlNode, TreeNodeData, TreeStructure } from "@src/types/html.types";
import { parse } from "parse5";
import { Document } from "parse5/dist/tree-adapters/default";
import { notify } from "./notificationService";

import { TNodeUid } from "@_api/types";
import { store } from "@src/_redux/store";
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

function clearOtherHoveredElements(keepElement?: Element) {
  const iframe = document.getElementById("iframeId") as HTMLIFrameElement;
  if (!iframe?.contentWindow?.document) return;
  const doc = iframe.contentWindow.document;

  const hoveredElements = doc.querySelectorAll(`[${HoverableAttribute}]`);

  hoveredElements?.forEach((el) => {
    if (keepElement && el === keepElement) {
      return;
    }
    el.removeAttribute(HoverableAttribute);
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
  if (!iframe?.contentWindow?.document || !uid) {
    clearOtherHoveredElements();
    return;
  }
  const doc = iframe.contentWindow.document;
  const hoveredElement = doc.querySelector(`[${StageNodeIdAttr}="${uid}"]`);

  if (hoveredElement) {
    clearOtherHoveredElements(hoveredElement);
    if (!hoveredElement.hasAttribute(HoverableAttribute)) {
      hoveredElement.setAttribute(HoverableAttribute, "");
    }
  } else {
    clearOtherHoveredElements();
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

function getHoverableNodeUids(): string[] {
  const selectedNodeUids =
    store.getState().main.currentPage?.nodeTreeViewState.selectedNodeUids;
  const selectedNodeUid =
    selectedNodeUids.length > 0
      ? selectedNodeUids[selectedNodeUids.length - 1]
      : null;
  const nodeTree = store.getState().main.currentPage?.newNodeTree;
  if (!nodeTree) {
    return [];
  }

  const hoverableUids = new Set<string>();
  let currentId: string | null = selectedNodeUid;

  while (currentId && currentId !== RootNodeUid) {
    hoverableUids.add(currentId);

    // Explicitly type parentId
    const parentId: string | undefined = nodeTree[currentId]?.data.parentId;

    if (parentId && nodeTree[parentId]) {
      nodeTree[parentId].children.forEach((siblingId) => {
        hoverableUids.add(siblingId);
      });
    } else {
      break;
    }
    currentId = parentId;
  }

  return Array.from(hoverableUids);
}

/**
 * Checks if potentialDescendantUid is a descendant of ancestorUid within a TreeStructure.
 * If it is, returns the UID of the direct child of ancestorUid that is on the path
 * towards potentialDescendantUid. Otherwise, returns false.
 */
function findDirectChildOnPath(
  potentialDescendantUid: TNodeUid,
  ancestorUid: TNodeUid,
  treeStructure: TreeStructure,
): TNodeUid | false {
  if (
    !treeStructure ||
    !treeStructure[potentialDescendantUid] ||
    !treeStructure[ancestorUid]
  ) {
    return false; // Invalid input
  }

  if (potentialDescendantUid === ancestorUid) {
    return false; // Cannot be a descendant of itself for drill-down
  }

  let currentUid: string | undefined | null =
    treeStructure[potentialDescendantUid]?.data?.parentId;
  let previousUid: string = potentialDescendantUid; // Keep track of the node before the current parent
  while (
    currentUid &&
    currentUid !== ancestorUid &&
    currentUid !== RootNodeUid
  ) {
    if (!treeStructure[currentUid]) {
      return false; // Structure inconsistency
    }
    previousUid = currentUid; // Update previous UID before moving up
    currentUid = treeStructure[currentUid]?.data?.parentId;
  }
  // If the loop stopped because currentUid === ancestorUid, then previousUid is the direct child we want
  return currentUid === ancestorUid ? previousUid : false;
}

function findNodeIdsByTagName(
  nodeTree: TreeStructure,
  tagName: string,
): string[] {
  return Object.entries(nodeTree)
    .filter(
      ([, node]) => node.data.nodeName.toLowerCase() === tagName.toLowerCase(),
    )
    .map(([uid]) => uid);
}

/**
 * Checks if clickedNodeUid is an ancestor of selectedNodeUid in the given tree structure.
 * Returns true if it is, and the UID of the sibling if it's a descendant of an ancestor excluding the current node. Otherwise, returns false.
 */
function findAncestor(clickedNodeUid: TNodeUid): boolean | TNodeUid {
  const selectedNodeUid =
    store.getState().main.currentPage?.nodeTreeViewState.selectedNodeUids[0];
  const treeStructure = store.getState().main.currentPage?.newNodeTree;

  if (!selectedNodeUid || !treeStructure) return false;

  let currentUid: TNodeUid | null = selectedNodeUid;
  const tree = treeStructure as unknown as Record<
    TNodeUid,
    {
      data: { parentId: TNodeUid | null };
      children?: TNodeUid[];
    }
  >;
  // Keep going up the tree until we find the potential ancestor or hit the root
  while (currentUid) {
    const currentNode:
      | {
          data: { parentId: TNodeUid | null };
          children?: TNodeUid[];
        }
      | undefined = tree[currentUid];
    if (!currentNode) break;

    // If we found the potential ancestor, return true
    if (currentUid === clickedNodeUid) {
      return true;
    }
    // Check if current node's parent has siblings that could be ancestors
    const parentId = currentNode.data.parentId;
    if (parentId) {
      const parent = tree[parentId];
      if (parent?.children) {
        // Check all siblings of the parent
        for (const siblingUid of parent.children) {
          if (siblingUid !== currentUid) {
            // If the clicked node is a direct sibling of parent, it's an ancestor
            if (siblingUid === clickedNodeUid) {
              return true;
            } else {
              // Check if the clicked node is a descendant of this sibling
              const isDescendant = findDirectChildOnPath(
                clickedNodeUid,
                siblingUid,
                treeStructure,
              );
              if (isDescendant) {
                return siblingUid;
              }
            }
          }
        }
      }
    }
    // Move up to the parent
    currentUid = currentNode.data.parentId;
  }

  return false;
}

/**
 * Checks if the clicked node is a sibling of the currently selected node.
 * Returns true if it is, and the UID of the sibling if it's a descendant of a sibling, returns false otherwise.
 */
function findSibling(clickedNodeUid: TNodeUid): boolean | TNodeUid {
  const selectedNodeUid =
    store.getState().main.currentPage?.nodeTreeViewState.selectedNodeUids[0];
  const treeStructure = store.getState().main.currentPage?.newNodeTree;

  if (!selectedNodeUid || !treeStructure) return false;

  const selectedNode = treeStructure[selectedNodeUid];
  if (!selectedNode?.data.parentId) return false;

  // Get the parent of the selected node to find its siblings
  const selectedNodeParent = treeStructure[selectedNode.data.parentId];
  if (!selectedNodeParent?.children) return false;

  // Check each sibling to see if the clicked node is its descendant
  for (const siblingUid of selectedNodeParent.children) {
    // excluding current selected node, check if the clicked node is its descendant
    if (siblingUid !== selectedNodeUid) {
      // First check if it's a direct sibling
      if (clickedNodeUid === siblingUid) {
        return true;
      }
      // Then check if it's a descendant of a sibling
      const isDescendant = findDirectChildOnPath(
        clickedNodeUid,
        siblingUid,
        treeStructure,
      );
      if (isDescendant) {
        return siblingUid;
      }
    }
  }

  return false;
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
  getHoverableNodeUids,
  findDirectChildOnPath,
  findNodeIdsByTagName,
  findAncestor,
  findSibling,
};
