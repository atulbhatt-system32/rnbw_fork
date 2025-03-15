import { useEffect } from "react";

import projectService from "@src/services/project.service";
import globalService from "@src/services/global.service";

interface IUseInit {
  onNew: () => Promise<void>;
}
export const useInit = ({ onNew }: IUseInit) => {
  // detect os
  useEffect(() => {
    globalService.initRnbw();
  }, []);

  // newbie
  useEffect(() => {
    if (globalService.isUserNewbie()) {
      onNew();
    } else {
      projectService.loadDefaultProject();
    }
  }, []);
};
