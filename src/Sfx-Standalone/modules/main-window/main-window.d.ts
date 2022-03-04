//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------


declare module "sfx.main-window" {
    import { BrowserWindow, OpenDialogOptions, OpenDialogReturnValue } from "electron";
    import { IDictionary } from "sfx.common";
    import { WindowManager } from "./main-window";

    export interface AddWindowEvent {
        id: string;
        url: string;
        queryParam?: Record<string, string>;
    }

    export interface IMainWindow {
        loadAsync(): void;
        addWindow(data: AddWindowEvent): void;
        removeWindow(id: string): void;
        setActiveWindow(id: string): void;
        requestDialogOpen(options: MessageBoxOptions): Promise<MessageBoxReturnValue> 
    }

    export interface IDialogService {
        onClose: () => Promise<void>;
        onPost: (data: any) => Promise<void>;
        showDialogAsync(pageUrl: string): Promise<void>;
        showInlineDialogAsync(options: IDialogRenderingOption): Promise<void>;
        closeInlineDialogAsync(): Promise<void>;
    }

    export interface IDialogFooterButtonOption {
        text: string;
        type: string;
        id?: string;
        cssClass?: string;
        attributes?: { [name: string]: string };        
    }

    export interface IDialogRenderingOption {
        title: string;
        bodyHtml: string;
        footerHtml?: string;
        footerButtons?: IDialogFooterButtonOption[];
        scriptPath?: string;
        height?: number;
        width?: number;
    }
}

declare module "sfx.module-manager" {
    import { IMainWindow } from "sfx.main-window";

    export interface ISfxModuleManager {
        getComponentAsync(componentIdentity: "sfx.main-window"): Promise<IMainWindow>;
    }
}

declare module "sfx.sfx-view-container" {
    export interface ISfxContainer {
        loadSfxAsync(cluster: ICluster): Promise<void>;
        unloadSfxAsync(targetServiceEndpoint: string): Promise<void>;
        reloadSfxAsync(targetServiceEndpoint: string): Promise<void>;
    }
}

declare module "sfx.cluster-list" {
    import { ICluster } from "sfx.cluster-list";

    export interface ICertInfoAuth {
        storeLocation: "Current User" | "Local Machine";
        storeName: string;
        findType: "Thumbprint" | "SubjectName";
        findValue: string;
        serverCommonNames: string;
    }
    
    export interface IClusterAuth {
        type: "Unsecure" | "aad" | "certificate";
        certInfo?: ICertInfoAuth;
    }
    
    
    export interface ICluster {
        displayName: string;
        endpoint: string;
        folder?: string;
        currentInView: boolean;
    
        authentication: IClusterAuth;
    }

    export interface IClusterList {
        newClusterListItemAsync(endpoint: string, name?: string, folder?: string, isCurrentInView?: boolean): Promise<void>;
        removeClusterListItem(label: string): Promise<void>;
        renameClusterListItem(old_cluster: string, new_cluster: string): Promise<void>;
        getDataModel(): Promise<IClusterListDataModel>;
    }

    export interface IClusterListDataModel {
        addFolder(label: string);
        addCluster(label: string, url: string, authInfo: IClusterAuth, folder: string);
        removeFolder(label: string);
        removeCluster(cluster_label: string, folder_label: string);
        renameFolder(old_name: string, new_name: string);
        renameCluster(old_name: string, new_name: string);
        moveCluster(label: string, new_folder_label: string);
        getFolders();
        getCluster(label: string, type: string);
        getFolder(label: string);
    }
}
