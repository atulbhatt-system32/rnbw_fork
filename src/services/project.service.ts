import eventEmitter from "./eventEmitter";
import {
  getIndexHtmlContent,
  getInitialCssContent,
  getInitialJsContent,
  TFileHandlerInfo,
  TFileHandlerInfoObj,
  TFileNode,
  TFileNodeTreeData,
  TNodeUid,
} from "@src/api";
import { store } from "@src/_redux/store";
import { setCurrentPage } from "@src/_redux/main/currentPage/currentPage.slice";
import { getPreviewPath } from "@src/processor/helpers";
import { SystemDirectories } from "@src/commandMenu/SystemDirectories";
import { FilerStats, TOsType } from "@src/types";
import {
  DefaultProjectPath,
  RootNodeUid,
  StagePreviewPathPrefix,
} from "@src/constants";
import { notify } from "./notificationService";
import {
  setFileTree,
  setInitialFileUidToOpen,
} from "@src/_redux/main/fileTree";
import {
  setCurrentProjectFileHandle,
  setFileHandlers,
} from "@src/_redux/main/project";

/* eslint-disable @typescript-eslint/no-var-requires */
const Filer = require("filer");
export const path = Filer.path;
export const fs = Filer.fs;
export const sh = new fs.Shell();

function reloadPage() {
  eventEmitter.emit("project", {
    type: "reloadPage",
    data: {
      message: "Reloading page",
    },
  });
}

async function openFile(file: TFileNode, fileTree: TFileNodeTreeData) {
  if (file) {
    const extension = file.data.ext;
    if (extension === "html") {
      const url = getPreviewPath(fileTree, file);
      let htmlContent = file.data.content;
      if (!htmlContent) {
        htmlContent = getIndexHtmlContent();
      }
      store.dispatch(
        setCurrentPage({
          designViewState: {
            previewPath: file.data.path,
            previewUrl: `rnbw${url}`,
            previewContent: htmlContent,
          },
          content: file.data.content,
        }),
      );
    } else {
      store.dispatch(
        setCurrentPage({
          content: file.data.content,
        }),
      );
    }
  }
}

function getFileExtension(fileName: string): string {
  const fileNameArr = fileName.split(".");
  return fileNameArr.length > 1 ? fileNameArr.pop() || "" : "";
}

function getFileNameWithoutExtension(fileName: string): string {
  const fileNameArr = fileName.split(".");
  if (fileNameArr.length > 1) {
    return fileNameArr.slice(0, -1).join(".");
  }
  return fileName;
}

function ifDirectoryShouldBeHidden(fileName: string, osType: TOsType): boolean {
  return SystemDirectories[osType][fileName] || fileName[0] === ".";
}

function removeProjectDirectory(projectPath: string) {
  return new Promise<void>((resolve, reject) => {
    sh.rm(projectPath, { recursive: true }, (err: Error) => {
      if (err) {
        notify.info("error", err.message);
        console.error(err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function createProjectDirectory(projectPath: string) {
  return new Promise<void>((resolve, reject) => {
    fs.mkdir(projectPath, { recursive: true }, (err: Error) => {
      if (err) {
        notify.info("error", err.message);
        console.error(err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function createInitialProjectFiles(projectPath: string) {
  return new Promise<void>((resolve, reject) => {
    try {
      const initialJSpath = `${projectPath}/script.js`;
      const initialJSContent = getInitialJsContent();

      const initialCSSpath = `${projectPath}/style.css`;
      const initialCSSContent = getInitialCssContent();

      const initialHTMLpath = `${projectPath}/index.html`;
      const initialHTMLContent = getIndexHtmlContent();

      fs.writeFile(initialJSpath, initialJSContent, (err: Error) => {
        if (err) {
          notify.info("error", err.message);
          console.error(err);
        }
      });

      fs.writeFile(initialCSSpath, initialCSSContent, (err: Error) => {
        if (err) {
          notify.info("error", err.message);
          console.error(err);
        }
      });

      fs.writeFile(initialHTMLpath, initialHTMLContent, (err: Error) => {
        if (err) {
          notify.info("error", err.message);
          console.error(err);
        }
      });
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

async function initWelcomeProject() {
  const projectPath = DefaultProjectPath;
  try {
    await removeProjectDirectory(projectPath);
    await createProjectDirectory(projectPath);
    await createInitialProjectFiles(projectPath);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function readIndexDBDirectory(path: string) {
  return new Promise<string[]>((resolve, reject) => {
    fs.readdir(path, (err: Error, files: string[]) => {
      err ? reject(err) : resolve(files);
    });
  });
}

function getIndexDBEntryStat(path: string) {
  return new Promise<FilerStats>((resolve, reject) => {
    fs.stat(path, (err: Error, stats: FilerStats) => {
      err ? reject(err) : resolve(stats);
    });
  });
}

async function readIndexDBFile(path: string) {
  return new Promise<Uint8Array>((resolve, reject) => {
    fs.readFile(path, (err: Error, data: Uint8Array) => {
      err ? reject(err) : resolve(data);
    });
  });
}

async function getChildHandlerObjectFromEntry({
  entry,
  parentUid,
  parentPath,
}: {
  entry: string;
  parentUid: string;
  parentPath: string;
}): Promise<TFileHandlerInfo> {
  const uid = path.join(parentUid, entry) as string;
  const childPath = path.join(parentPath, entry) as string;
  const entryStat = await getIndexDBEntryStat(childPath);
  const ext = entryStat.type === "FILE" ? getFileExtension(entry) : "";
  let content: Uint8Array | undefined;
  if (entryStat.type === "FILE") {
    content = await readIndexDBFile(childPath);
  }
  const kind = entryStat.type === "DIRECTORY" ? "directory" : "file";
  return {
    uid,
    parentUid,
    children: [],
    path: childPath,
    kind,
    name: entry,
    ext,
    content,
  };
}

async function createFileHandlersObject(projectPath: string) {
  return new Promise<TFileHandlerInfoObj>((resolve, reject) => {
    try {
      // create root handler
      const rootHandler: TFileHandlerInfo = {
        uid: RootNodeUid,
        parentUid: null,
        children: [],
        path: projectPath,
        kind: "directory",
        name: projectPath.replace("/", ""),
      };

      // create handlers obj for complex tree
      const handlerObj: TFileHandlerInfoObj = { [RootNodeUid]: rootHandler };

      // loop through the project
      const dirHandlers: TFileHandlerInfo[] = [rootHandler];
      while (dirHandlers.length) {
        const { uid: parentUid, path: parent_path } =
          dirHandlers.shift() as TFileHandlerInfo;

        readIndexDBDirectory(parent_path).then((entries) => {
          return Promise.all(
            entries.map(async (entry) => {
              // skip stage preview files & hidden files
              if (entry.startsWith(StagePreviewPathPrefix) || entry[0] === ".")
                return;

              const childHandler = await getChildHandlerObjectFromEntry({
                entry,
                parentUid,
                parentPath: parent_path,
              });

              handlerObj[childHandler.uid] = childHandler;
              handlerObj[parentUid].children.push(childHandler.uid);
            }),
          );
        });
      }

      resolve(handlerObj);
    } catch (err) {
      reject(err);
    }
  });
}

async function buildFileTree(fileHandlersObj: TFileHandlerInfoObj) {
  return new Promise<TFileNodeTreeData>((resolve, reject) => {
    try {
      const fileTree: TFileNodeTreeData = {};
      Object.keys(fileHandlersObj).map((uid) => {
        const { parentUid, children, path, kind, name, ext, content } =
          fileHandlersObj[uid];

        const fileContent = content?.toString() || "";
        fileTree[uid] = {
          uid,
          parentUid,
          children,
          displayName: name,
          isEntity: kind === "file",
          data: {
            valid: true,
            path,
            kind,
            name,
            ext: ext || "",
            orgContent: fileContent,
            content: fileContent,
            contentInApp: "",
            changed: false,
          },
        };
      });
      resolve(fileTree);
    } catch (err) {
      reject(err);
    }
  });
}

function getInitialFileUidToOpen(handlerObj: TFileHandlerInfoObj) {
  let firstHtmlUid: TNodeUid = "",
    indexHtmlUid: TNodeUid = "",
    initialFileUidToOpen: TNodeUid = "";

  // get the index/first html file to be opened by default
  handlerObj[RootNodeUid].children.map((uid) => {
    const handler = handlerObj[uid];
    if (handler.kind === "file" && handler.ext === "html") {
      firstHtmlUid === "" ? (firstHtmlUid = uid) : null;
      handler.name === "index" ? (indexHtmlUid = uid) : null;
    }
  });
  // define the initialFileUidToOpen
  initialFileUidToOpen =
    indexHtmlUid !== ""
      ? indexHtmlUid
      : firstHtmlUid !== ""
        ? firstHtmlUid
        : "";

  return initialFileUidToOpen;
}

async function loadDefaultProject() {
  const projectPath = DefaultProjectPath;
  const fileHandlersObj = await createFileHandlersObject(projectPath);
  const fileTree = await buildFileTree(fileHandlersObj);
  const initialFileUidToOpen = getInitialFileUidToOpen(fileHandlersObj);

  store.dispatch(setFileTree(fileTree));
  store.dispatch(setCurrentProjectFileHandle(null));
  store.dispatch(setInitialFileUidToOpen(initialFileUidToOpen));
  store.dispatch(setFileHandlers({}));
}

export default {
  openFile,
  reloadPage,
  getFileExtension,
  getFileNameWithoutExtension,
  ifDirectoryShouldBeHidden,
  initWelcomeProject,
  loadDefaultProject,
  createFileHandlersObject,
};
