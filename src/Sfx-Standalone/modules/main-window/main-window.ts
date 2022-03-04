//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { AddWindowEvent, IMainWindow } from "sfx.main-window";
import { BrowserView, BrowserWindow, dialog, ipcMain, MessageBoxOptions, MessageBoxReturnValue, OpenDialogOptions, OpenDialogReturnValue } from "electron";
import { resolve } from "donuts.node/path";
import { IComponentConfiguration } from "sfx.common";
import * as shell from "donuts.node/shell";
import * as modularity from "donuts.node-modularity";
const path = require('path')

export class MainWindow implements IMainWindow {
    private browserWindow: BrowserWindow;
    private components: IComponentConfiguration[] = [];
    private windows: Record<string, BrowserView> = {};
    private activeWindow: BrowserView;

    constructor(browserWindow: BrowserWindow) {
        this.browserWindow = browserWindow;
        browserWindow.setPosition(100, 100);
        browserWindow.setSize(1500, 1200);
        // browserWindow.setMenuBarVisibility(true);
        browserWindow.webContents.openDevTools({mode :'detach'});

    }

    async registerAsync(navComponent: IComponentConfiguration): Promise<void> {
        this.components.push(navComponent);
        return Promise.resolve();
    }

    async loadAsync(): Promise<void> {
        this.browserWindow.loadURL(resolve("index.html"));
        
        this.browserWindow.once("ready-to-show", async () => {
            this.browserWindow["rendered.process.args"] = shell.toCmdArg(
                modularity.CmdArgs.ConnectionInfo, 
                JSON.stringify(modularity.getConnectionInfo(sfxModuleManager)));

            this.browserWindow.show();
        });

        return Promise.resolve();
    }

    async getWindowAsync(): Promise<BrowserWindow> {
        return this.browserWindow;
    }

    async addWindow(data: AddWindowEvent) {
        const { id, url, queryParam } = data;
        if (id in this.windows) {
            this.setActiveWindow(id);
            return;
        }

        let view = new BrowserView({
            webPreferences: {
                contextIsolation: true,
                nodeIntegration: true,
                preload: path.join(__dirname, 'sfx-container', 'test')
            }
        })

        view.setAutoResize({ width: true, height: true });
        const bounds = this.browserWindow.getBounds()
        const offSetX = 300;
        const offsetY = 0;
        view.setBounds({ x: offSetX, y: offsetY, width: (bounds.width - offSetX - 15), height: (bounds.height - offsetY) })
        view.webContents.loadFile(url, { query: queryParam})
        view.webContents.toggleDevTools();
        this.windows[id] = view;

        this.setActiveWindow(id);
    }

    async setActiveWindow(id: string) {
        if (this.activeWindow) {
            this.browserWindow.removeBrowserView(this.activeWindow);
        }
        this.browserWindow.addBrowserView(this.windows[id]);
        this.activeWindow = this.windows[id];
    }

    async removeWindow(id: string) {
        this.browserWindow.removeBrowserView(this.windows[id]);
        console.log(this.windows[id])
        delete this.windows[id];
    }

    async requestDialogOpen(options: MessageBoxOptions): Promise<MessageBoxReturnValue> {
        return await dialog.showMessageBox(options);
    }

}
