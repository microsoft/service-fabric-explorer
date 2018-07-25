//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "sfx.main-window" {    
    export interface IMainWindow {        
        loadAsync(): void;                
    }

    export interface IDialogService {
        showDialogAsync(pageUrl: string): Promise<void>;
    }
}

declare module "sfx.module-manager" {
    import { IMainWindow } from "sfx.main-window";    

    export interface IModuleManager {
        getComponentAsync(componentIdentity: "main-window"): Promise<IMainWindow>;        
    }
}

declare module "sfx.sfx-view-container" {
    export interface ISfxContainer {
        LoadSfxAsync(targetServiceEndpoint: string): Promise<void>;
    }
}

declare module "sfx.cluster-list" {
    export interface IClusterList {
        newListItemAsync(endpoint: string, name?: string): Promise<void>;
    }
}
