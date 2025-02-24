export type HtmlEventType = "morph";

export interface HTMLMorphEventData {
  morphContent: string;
}
export interface HtmlEvent {
  type: HtmlEventType;
  data: HTMLMorphEventData;
}
