//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IMainWindow } from "sfx.main-window";
import { BrowserWindow } from "electron";
import { resolve } from "../../utilities/appUtils";
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

    private components: IComponentConfiguration[] = [];    
    private browserWindow: BrowserWindow;    

    constructor(browserWindow: BrowserWindow) {        
        this.browserWindow = browserWindow;
    }

    async registerAsync(navComponent: IComponentConfiguration): Promise<void> {
        this.components.push(navComponent);

        return Promise.resolve();
    }

    async loadAsync(): Promise<void> {
        this.browserWindow.loadURL(resolve("index.html"));
        
        this.browserWindow.once("ready-to-show", async () => {            
            this.browserWindow.webContents.openDevTools();
            this.browserWindow.show();
            
        });
        return Promise.resolve();
    }

    

   
}
