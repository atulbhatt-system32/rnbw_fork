import { useCallback } from "react";

import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import { LogAllow, DefaultProjectPath, RootNodeUid } from "@src/constants";
import {
  buildNohostIDB,
  createURLPath,
  getIndexHtmlContent,
  loadIDBProject,
  loadLocalProject,
} from "@_api/file";
import {
  focusFileTreeNode,
  setDoingFileAction,
  setFileTree,
  setInitialFileUidToOpen,
  setProject,
  TProjectContext,
  updateFileTreeViewState,
} from "@_redux/main/fileTree";
import {
  setCurrentFileContent,
  setCurrentFileUid,
} from "@_redux/main/nodeTree";
import {
  setLoadingFalse,
  setLoadingTrue,
  setNavigatorDropdownType,
} from "@_redux/main/processor";
import { useAppState } from "@_redux/useAppState";

import { clearProjectSession } from "../helper";
import {
  setCurrentProjectFileHandle,
  setFileHandlers,
} from "@_redux/main/project";

import projectService from "@src/services/project.service";

export const useHandlers = () => {
  const { currentProjectFileHandle } = useAppState();

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { osType, navigatorDropdownType, project, fileTree, currentFileUid } =
    useAppState();

  const { "*": rest } = useParams();

  const importProject = useCallback(
    async (
      fsType: TProjectContext,
      projectHandle?: FileSystemDirectoryHandle | null,
      fromURL?: boolean,
    ) => {
      if (fsType === "local") {
        dispatch(setDoingFileAction(true));
        try {
          const {
            handlerArr,
            _fileHandlers,

            _fileTree,
            _initialFileUidToOpen,
          } = await loadLocalProject(
            projectHandle as FileSystemDirectoryHandle,
            osType,
          );
          dispatch(setLoadingTrue());
          clearProjectSession(dispatch);

          // build nohost idb
          buildNohostIDB(handlerArr);

          dispatch(
            setProject({
              context: "local",
              name: (projectHandle as FileSystemDirectoryHandle).name,
              favicon: null,
            }),
          );
          dispatch(
            setCurrentProjectFileHandle(
              projectHandle as FileSystemDirectoryHandle,
            ),
          );

          dispatch(setFileTree(_fileTree));
          dispatch(setInitialFileUidToOpen(_initialFileUidToOpen));
          dispatch(setFileHandlers(_fileHandlers));

          projectService.openFile(_fileTree[_initialFileUidToOpen], _fileTree);

          await projectService.saveRecentProject(
            fsType,
            projectHandle as FileSystemDirectoryHandle,
          );

          const pathURL = createURLPath(
            fromURL ? `${RootNodeUid}/${rest}` : _initialFileUidToOpen,
            RootNodeUid,
            _fileTree[RootNodeUid]?.displayName,
          );
          navigate(pathURL);
        } catch (err) {
          LogAllow && console.log("ERROR while importing local project", err);
        }
        dispatch(setDoingFileAction(false));
        dispatch(setLoadingFalse());
      } else if (fsType === "idb") {
        dispatch(setDoingFileAction(true));
        try {
          const { _fileTree, _initialFileUidToOpen } =
            await loadIDBProject(DefaultProjectPath);

          clearProjectSession(dispatch);

          dispatch(
            setProject({
              context: "idb",
              name: "Welcome",
              favicon: null,
            }),
          );
          dispatch(setCurrentProjectFileHandle(null));

          dispatch(setFileTree(_fileTree));
          dispatch(setInitialFileUidToOpen(_initialFileUidToOpen));
          dispatch(setFileHandlers({}));
        } catch (err) {
          LogAllow && console.log("ERROR while importing IDB project", err);
        }
        dispatch(setDoingFileAction(false));
      }
    },
    [osType, rest],
  );

  const reloadCurrentProject = useCallback(async () => {
    try {
      if (project.context === "local") {
        const {
          handlerArr,
          _fileHandlers,
          _fileTree,
          _initialFileUidToOpen,
          deletedUids,
          deletedUidsObj,
        } = await loadLocalProject(
          currentProjectFileHandle as FileSystemDirectoryHandle,
          osType,
          true,
          fileTree,
        );
        await dispatch(setFileTree(_fileTree));
        await dispatch(setFileHandlers(_fileHandlers));
        // need to open another file if the current open file is deleted

        if (deletedUidsObj[currentFileUid] || !currentFileUid) {
          await dispatch(setCurrentFileUid(_initialFileUidToOpen));
          await dispatch(
            setCurrentFileContent(
              _fileTree[_initialFileUidToOpen].data.content ||
                getIndexHtmlContent(),
            ),
          );
          await dispatch(focusFileTreeNode(_initialFileUidToOpen));

          const pathURL = createURLPath(
            _initialFileUidToOpen,
            RootNodeUid,
            _fileTree[RootNodeUid]?.displayName,
          );
          navigate(pathURL);
        } else if (_initialFileUidToOpen == "") {
          await dispatch(setCurrentFileUid(""));
          await dispatch(setCurrentFileContent(""));
        } else if (currentFileUid) {
          await dispatch(setCurrentFileUid(currentFileUid));
          await dispatch(
            setCurrentFileContent(
              _fileTree[currentFileUid].data.content
                ? _fileTree[currentFileUid].data.content
                : _fileTree[currentFileUid].data.ext === "html"
                  ? getIndexHtmlContent()
                  : "",
            ),
          );
        }
        // update file tree view state
        await dispatch(updateFileTreeViewState({ deletedUids: deletedUids }));
        // build nohost idb

        const deletedUidsPath = deletedUids
          .map((uid) => fileTree[uid].data.path)
          .filter((path) => path);

        buildNohostIDB(handlerArr, deletedUidsPath);
      } else {
        try {
          const {
            _fileTree,
            _initialFileUidToOpen,
            deletedUidsObj,
            deletedUids,
          } = await loadIDBProject(DefaultProjectPath, true, fileTree);
          await dispatch(setFileTree(_fileTree));
          // need to open another file if the current open file is deleted
          if (deletedUidsObj[currentFileUid]) {
            if (_initialFileUidToOpen !== "") {
              await dispatch(setCurrentFileUid(_initialFileUidToOpen));

              await dispatch(
                setCurrentFileContent(
                  _fileTree[_initialFileUidToOpen].data.content,
                ),
              );
            } else {
              await dispatch(setCurrentFileUid(""));
              await dispatch(setCurrentFileContent(""));
            }
          }
          // update file tree view state
          await dispatch(updateFileTreeViewState({ deletedUids: deletedUids }));
        } catch (err) {
          LogAllow && console.log("ERROR while reloading IDB project", err);
        }
      }
    } catch (err) {
      console.log(err);
    }
  }, [project, currentProjectFileHandle, osType, fileTree, currentFileUid]);

  const closeNavigator = useCallback(() => {
    navigatorDropdownType !== null && dispatch(setNavigatorDropdownType(null));
  }, [navigatorDropdownType]);

  return {
    importProject,
    closeNavigator,
    reloadCurrentProject,
  };
};
