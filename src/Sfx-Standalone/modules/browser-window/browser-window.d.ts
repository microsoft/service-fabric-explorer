//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "sfx.module-manager" {
    import { BrowserWindow, BrowserWindowConstructorOptions } from "electron";

    export interface IModuleManager {
        getComponentAsync(componentIdentity: "browser-window",
            options?: BrowserWindowConstructorOptions): Promise<BrowserWindow>;
    }
}
