//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { BrowserWindow, BrowserWindowConstructorOptions } from "electron";

declare global {
    interface IModuleManager {
        getComponent(componentIdentity: "browser-window",
            options?: BrowserWindowConstructorOptions,
            handleAuth?: boolean,
            aadTargetHostName?: string): BrowserWindow;
    }
}
