import { IpcRendererEvent } from "electron";
import { ICluster, IClusterListState } from "./cluster-manager";
import { MainWindowEvents } from "./constants";
import { IHttpRequest } from "./mainWindow/global";

const { contextBridge, ipcRenderer } = require('electron')

type onClusterListChange = (event: IpcRendererEvent, clusters: IClusterListState) => void;

contextBridge.exposeInMainWorld('electronInterop', {
    sendHttpRequest: async (data: IHttpRequest) => {
        const res = await ipcRenderer.invoke(MainWindowEvents.sendHttpRequest, data)
        console.log(res);
        return res;
    },
    requestFileDialog: async (data: any) => {
        const res = await ipcRenderer.invoke(MainWindowEvents.requestFileDialog, data)
        console.log(res);
        return res;
    },

    addCluster: async (cluster: ICluster) => {
        ipcRenderer.send(MainWindowEvents.addCluster, cluster)
    },
    removeCluster: async (cluster: ICluster) => {
        ipcRenderer.send(MainWindowEvents.removeCluster, cluster)
    },
    editCluster: async (cluster: ICluster) => {
        ipcRenderer.send(MainWindowEvents.editCluster, cluster)
    },
    reconnectCluster: async (cluster: ICluster) => {
        ipcRenderer.send(MainWindowEvents.reconnectCluster, cluster)
    },
    disconnectCluster: async (cluster: ICluster) => {
        ipcRenderer.send(MainWindowEvents.disconnectCLuster, cluster)
    },
    requestClusterState: async () => {
        ipcRenderer.send(MainWindowEvents.requestClusterState)
    },
    onClusterListChange: (callback: onClusterListChange) => ipcRenderer.on(MainWindowEvents.clusterStatesChange, callback),

})
