//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IMainWindow } from "sfx.main-window";
import { BrowserWindow } from "electron";
import { resolve } from "donuts.node/path";
import { IComponentConfiguration } from "sfx.common";

export class MainWindow implements IMainWindow {
    private browserWindow: BrowserWindow;
    private components: IComponentConfiguration[] = [];

    constructor(browserWindow: BrowserWindow) {
        this.browserWindow = browserWindow;
        browserWindow.setPosition(100, 100);
        browserWindow.setSize(1500, 1200);
    }

    async registerAsync(navComponent: IComponentConfiguration): Promise<void> {
        this.components.push(navComponent);
        return Promise.resolve();
    }

    async loadAsync(): Promise<void> {
        this.browserWindow.loadURL(resolve("index.html"));

        this.browserWindow.once("ready-to-show", async () => {
            this.browserWindow.webContents.openDevTools(); /*uncomment to use development tools */
            this.browserWindow.show();
        });

        return Promise.resolve();
    }

    async getWindowAsync(): Promise<BrowserWindow> {
        return this.browserWindow;
    }
}
