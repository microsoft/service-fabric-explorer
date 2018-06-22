//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { BrowserWindow } from "electron";

declare module "sfx.main-window" {
    import { IDisposable } from "sfx.common";
    
    export interface IMainWindow {
        register(): void;    
    }
}

declare module "sfx.module-manager" {    
    export interface IModuleManager {
        getComponentAsync(componentIdentity: "main-window"): Promise<BrowserWindow>;
    }
}
