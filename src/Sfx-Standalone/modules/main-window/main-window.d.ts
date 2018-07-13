//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "sfx.main-window" {    
    export interface IMainWindow {        
        load(): void;                
    }
}

declare module "sfx.module-manager" {
    import { IMainWindow } from "sfx.main-window";    

    export interface IModuleManager {
        getComponentAsync(componentIdentity: "main-window"): Promise<IMainWindow>;        
    }
}

