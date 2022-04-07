import { IpcRendererEvent } from "electron";
import { ILoggedInAccounts } from "./auth/aad";
import { ICluster, IClusterListState } from "./cluster-manager";
import { MainWindowEvents } from "./constants";
import { IHttpRequest } from "./mainWindow/global";

const { contextBridge, ipcRenderer } = require('electron')

export type onClusterListChange = (event: IpcRendererEvent, clusters: IClusterListState) => void;
export type onAADConfigurationsChange = (event: IpcRendererEvent, clusters: ILoggedInAccounts[]) => void;

contextBridge.exposeInMainWorld('electronInterop', {
    sendHttpRequest: async (data: IHttpRequest) => {
        const res = await ipcRenderer.invoke(MainWindowEvents.sendHttpRequest, data)
        return res;
    },
    requestFileDialog: async (data: any) => {
        const res = await ipcRenderer.invoke(MainWindowEvents.requestFileDialog, data)
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
    requestAADState: async () => {
        ipcRenderer.send(MainWindowEvents.requestAADConfigurations)
    },
    onClusterListChange: (callback: onClusterListChange) => ipcRenderer.on(MainWindowEvents.clusterStatesChange, callback),
    onAADConfigurationsChange: (callback: onAADConfigurationsChange) => ipcRenderer.on(MainWindowEvents.AADConfigurationsChange, callback),
    logoutOfAad: async (tenant: string) => {
        ipcRenderer.send(MainWindowEvents.logoutOfAadAccount, tenant)
    },
})
