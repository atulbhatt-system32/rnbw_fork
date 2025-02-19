import { ProjectEvent } from "@src/types";
import eventEmitter from "./eventEmitter";

const project = (project: ProjectEvent) => {
  switch (project) {
    case "reloadPage":
      eventEmitter.emit("project", "reloadPage");
      break;
    case "getProject":
      eventEmitter.emit("project", "getProject");
      break;
    case "reloadProject":
      eventEmitter.emit("project", "reloadProject");
      break;
  }
};

project.getProject = () => {
  eventEmitter.emit("project", "getProject");
};

project.reloadProject = () => {
  eventEmitter.emit("project", "reloadProject");
};

project.reloadPage = () => {
  eventEmitter.emit("project", "reloadPage");
};

export default project;
