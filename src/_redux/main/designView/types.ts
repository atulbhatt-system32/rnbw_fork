export type TDesignViewReducerState = {
  iframeLoading: boolean;
  linkToOpen: string | null;
  syncConfigs: DesignViewSyncConfigs;
};

export type DesignViewSyncConfigs = {
  matchIds?: string[] | null;
  skipFromChildren?: boolean;
};
