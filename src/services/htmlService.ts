import { rehype } from "rehype";
import { HtmlEvent } from "@src/types";
import eventEmitter from "./eventEmitter";

const htmlService = (event: HtmlEvent) => {
  if (event.type === "morph") {
    htmlService.morphPage(event.data.morphContent);
  }
};

htmlService.morphPage = (morphContent: string) => {
  eventEmitter.emit("html", { type: "morph", data: { morphContent } });
};

htmlService.parseHtml = async (html: string) => {
  const processor = rehype().data("settings", {
    emitParseErrors: true,
  });

  const rehypeResult = await processor.parse(html);
  return rehypeResult;
};

export default htmlService;
