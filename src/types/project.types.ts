export type ProjectEvent = "reloadPage" | "reloadProject" | "getProject";

export interface ProjectEventData {
  type: ProjectEvent;
  data?: {
    message: string;
  };
}
