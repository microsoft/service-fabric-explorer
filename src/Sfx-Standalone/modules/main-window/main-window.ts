//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IMainWindow } from "sfx.main-window";
import { BrowserWindow, ipcMain, WebContents, webContents } from "electron";
import { resolve } from "../../utilities/appUtils";
import { ICommunicator, AsyncRequestHandler, IRoutePattern } from "sfx.remoting";
import { IModuleManager } from "sfx.module-manager";
import { DialogService } from "./dialog-service";
import { IComponentConfiguration } from "sfx.common";

export class ClusterManagerComponentConfig implements IComponentConfiguration {
    id: string = "cluster-list";
    title: string = "Clusters";
    iconUrl?: string;
    viewUrl: string = resolve("./cluster-list/cluster-list.html");
    mainViewUrl?: string;
}

export class SettingsComponentConfig implements IComponentConfiguration {
    id: string = "settings";
    title: string = "Settings";
    iconUrl?: string;
    viewUrl: string = resolve("./settings/settings.html");
    mainViewUrl?: string;
}

export class MainWindow implements IMainWindow {

    public components: IComponentConfiguration[] = [];
    public moduleManager: IModuleManager;
    public browserWindow: BrowserWindow;    

    constructor(moduleManager: IModuleManager, browserWindow: BrowserWindow) {
        this.moduleManager = moduleManager;
        this.browserWindow = browserWindow;
    }

    register(navComponent: IComponentConfiguration): void {
        this.components.push(navComponent);
    }

    load(): void {
        this.browserWindow.loadURL(resolve("index.html"));
        
        this.browserWindow.once("ready-to-show", async () => {            
            this.browserWindow.webContents.openDevTools();
            this.browserWindow.show();
        });
    }
}
