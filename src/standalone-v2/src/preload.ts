import { IpcRendererEvent } from "electron";
import { ILoggedInAccounts } from "./auth/aad";
import { ICluster, IClusterAuth, IClusterListState } from "./cluster-manager";
import { MainWindowEvents } from "./constants";
import { IHttpRequest } from "./mainWindow/global";
import { INotification } from "./notificationManager";

const { contextBridge, ipcRenderer } = require('electron')

export type onClusterListChange = (event: IpcRendererEvent, clusters: IClusterListState) => void;
export type onAADConfigurationsChange = (event: IpcRendererEvent, accounts: ILoggedInAccounts[]) => void;
export type onNotificationEvent = (event: IpcRendererEvent, notification: INotification) => void;

contextBridge.exposeInMainWorld('electronInterop', {
    sendHttpRequest: async (data: IHttpRequest) => {
        return await ipcRenderer.invoke(MainWindowEvents.sendHttpRequest, data)
    },
    requestFileDialog: async (data: any) => {
        return await ipcRenderer.invoke(MainWindowEvents.requestFileDialog, data)
    },
    addCluster: async (cluster: ICluster) => {
        ipcRenderer.send(MainWindowEvents.addCluster, cluster)
    },
    connectCluster: async (cluster: ICluster) => {
        ipcRenderer.send(MainWindowEvents.connectCluster, cluster)
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
    bulkImportCluster: async (cluster: ICluster[]) => {
        ipcRenderer.send(MainWindowEvents.importCLusters, cluster)
    },

    validateAuthConfiguration: async (auth: IClusterAuth) => {
        return ipcRenderer.invoke(MainWindowEvents.validateAuthConfig, auth);
    },
    requestNotifications: async () => {
        return ipcRenderer.invoke(MainWindowEvents.getNotifications)
    },

    onNotificationEvent: (callback: onNotificationEvent) => ipcRenderer.on(MainWindowEvents.notificationEvent, callback),

    onClusterListChange: (callback: onClusterListChange) => ipcRenderer.on(MainWindowEvents.clusterStatesChange, callback),
    onAADConfigurationsChange: (callback: onAADConfigurationsChange) => ipcRenderer.on(MainWindowEvents.AADConfigurationsChange, callback),
    logoutOfAad: async (tenant: string) => {
        ipcRenderer.send(MainWindowEvents.logoutOfAadAccount, tenant)
    },
})
