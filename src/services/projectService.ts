import { ProjectEvent } from "@src/types";
import eventEmitter from "./eventEmitter";
import { TFileNodeTreeData } from "@src/api";

const project = (projectEvent: ProjectEvent) => {
  const { type } = projectEvent;
  if (type === "reloadPage") {
    eventEmitter.emit("project", projectEvent);
  } else if (type === "openFile") {
    eventEmitter.emit("project", projectEvent);
  }
};

project.reloadPage = () => {
  eventEmitter.emit("project", {
    type: "reloadPage",
    data: {
      message: "Reloading page",
    },
  });
};

project.openFile = (uid: string, fileTree: TFileNodeTreeData) => {
  eventEmitter.emit("project", {
    type: "openFile",
    data: {
      fileUid: uid,
      fileTree: fileTree,
    },
  });
};

export default project;
