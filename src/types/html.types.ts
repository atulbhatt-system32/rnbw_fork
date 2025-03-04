interface HtmlNode extends Element {
  attrs: { name: string; value: string }[];
}

interface TreeNodeData {
  canMove?: boolean;
  canRename?: boolean;
  children: string[];
  isFolder: boolean;
  index: string;
  data: {
    nodeName: string;
    attributes: Record<string, string | number | boolean | null>[];
    parentId: string;
  };
}

interface TreeStructure {
  [key: string]: TreeNodeData;
}

export type { TreeNodeData, TreeStructure, HtmlNode };
