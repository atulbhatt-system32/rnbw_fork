import eventEmitter from "./eventEmitter";
import { TFileNode } from "@src/api";
import htmlService from "./html.service";

function reloadPage() {
  eventEmitter.emit("project", {
    type: "reloadPage",
    data: {
      message: "Reloading page",
    },
  });
}

async function openFile(file: TFileNode) {
  if (file) {
    const extension = file.data.ext;
    if (extension === "html") {
      const result = await htmlService.parseHtml(file.data.content);
      console.log("result", result);
    }
  }
}

export default { openFile, reloadPage };
