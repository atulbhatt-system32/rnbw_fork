import { TFileNodeTreeData } from "@src/api";

function findAllJSFiles(fileTree: TFileNodeTreeData) {
  const jsFiles: string[] = [];
  const queue = [fileTree];
  while (queue.length > 0) {
    const file = queue.shift();
    if (!file) continue;
    const fileData = file.data.data;
    if (fileData?.kind === "file" && fileData.ext === "js") {
      const filePath = fileData.path;
      if (filePath) {
        jsFiles.push(filePath);
      }
    } else if (fileData?.kind === "directory") {
      const children = fileData.children;
      if (children) {
        queue.push(...children);
      }
    }
  }
  return jsFiles;
}

export default {
  findAllJSFiles,
};
