import { RootNodeUid } from "@src/rnbwTSX";
import { parse } from "parse5";
import { Document } from "parse5/dist/tree-adapters/default";
import { notify } from "./notificationService";
import { TreeNodeData, TreeStructure } from "@src/types/html.types";
import { StageNodeIdAttr } from "@src/api";

interface HtmlNode extends Element {
  attrs: { name: string; value: string }[];
}
function parseHtml(html: string) {
  const document = parse(html, {
    sourceCodeLocationInfo: true,
  });
  return document;
}

let maxNodeUid = 0; // Initialize the counter for unique IDs

function generateUniqueNodeId(node: Element): string {
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

function createPreviewContent() {
  const previewContent = "";
  return previewContent;
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

function scrollToElement(uid: string) {
  const iframe = document.getElementById("iframeId") as HTMLIFrameElement;
  const element = iframe?.contentWindow?.document?.querySelector(
    `[${StageNodeIdAttr}="${uid}"]`,
  );
  element?.scrollIntoView({ behavior: "smooth" });
}

function isElementWebComponent(element: Element): boolean {
  // Check if element name contains a hyphen (standard convention for custom elements)
  const hasHyphen = element.tagName.includes("-");

  // Check if element has a shadow root (another key characteristic of many web components)
  const hasShadowRoot = !!element.shadowRoot;

  // Check if element is registered as a custom element
  const isCustomElement =
    customElements.get(element.tagName.toLowerCase()) !== undefined;

  return hasHyphen || hasShadowRoot || isCustomElement;
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
    const isWebComponent = isElementWebComponent(selectedElement as Element);
    if (isWebComponent) {
      selectedElement = selectedElement?.firstElementChild;
    }
    selectedElement?.setAttribute("rnbwdev-rnbw-element-select", "");
  });
}

export default {
  parseHtml,
  createNodeTree,
  createPreviewContent,
  getInitialExpandedNodesFromNodeTree,
  markSelectedElements,
  scrollToElement,
};
