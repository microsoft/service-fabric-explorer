//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "sfx.main-window" {
    import { BrowserWindow } from "electron";
    import { IDictionary } from "sfx.common";

    export interface IMainWindow {
        loadAsync(): void;
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
        loadSfxAsync(targetServiceEndpoint: string, clusterDisplayName: string): Promise<void>;
        unloadSfxAsync(targetServiceEndpoint: string): Promise<void>;
        reloadSfxAsync(targetServiceEndpoint: string): Promise<void>;
    }
}

declare module "sfx.cluster-list" {
    export interface IClusterList {
        newClusterListItemAsync(endpoint: string, name?: string, folder?: string, isCurrentInView?: boolean): Promise<void>;
        removeClusterListItem(label: string): Promise<void>;
        renameClusterListItem(old_cluster: string, new_cluster: string): Promise<void>;
        getDataModel(): Promise<IClusterListDataModel>;
    }

    export interface IClusterListDataModel {
        addFolder(label: string);
        addCluster(label: string, url: string, folder: string);
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
