import { RootNodeUid } from "@src/rnbwTSX";
import { parse } from "parse5";
import { Document } from "parse5/dist/tree-adapters/default";
import { notify } from "./notificationService";
import { TreeNodeData, TreeStructure } from "@src/types/html.types";

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
    node: Element,
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
    if (node.attributes) {
      for (const attr of node.attributes) {
        attributes.push({
          [attr.name]: attr.value,
        });
      }
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
          child as unknown as Element,
          //@ts-expect-error - allow indexing with a string
          currentNode[nodeUid],
          nodeUid,
        );
      });
    }
  }

  traverseNode(
    rootNode as unknown as Element,
    complexTreeTemplate[RootNodeUid],
    RootNodeUid,
  );

  return { complexNodeTree, document };
}

function createPreviewContent() {
  const previewContent = "";
  return previewContent;
}

export default {
  parseHtml,
  createNodeTree,
  createPreviewContent,
};
