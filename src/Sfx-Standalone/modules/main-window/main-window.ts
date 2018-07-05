//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IMainWindow, IComponentConfiguration } from "sfx.main-window";
import { BrowserWindow, ipcMain, WebContents, webContents } from "electron";
import { resolve } from "../../utilities/appUtils";
import * as utils from "../../utilities/utils";
import { ICommunicator, AsyncRequestHandler, IRoutePattern } from "sfx.remoting";
import * as mmutils from "../../module-manager/utils";
import { IModuleManager } from "sfx.module-manager";

export class LocalSfxVueComponent implements IComponentConfiguration {
    id: "cluster-list";
    title: string = "Clusters";
    iconUrl?: string;
    viewUrl: string = resolve("./cluster-list/cluster-list.html");
    mainViewUrl?: string;

    public handleButtonClick(): Promise<void> {


        return Promise.resolve();
    }

    constructor () {

    }
}

export class MainWindow implements IMainWindow {

    public components: IComponentConfiguration[] = [];
    public moduleManager: IModuleManager;
    public browserWindow: BrowserWindow;
    public communicator: ICommunicator;

    constructor(moduleManager: IModuleManager, browserWindow: BrowserWindow) {
        this.moduleManager = moduleManager;
        this.browserWindow = browserWindow;
    }

    register(navComponent: IComponentConfiguration): void {
        this.components.push(navComponent);
    }

    load(): void {
        ipcMain.once("request-module-manager-constructor-options-component", (event: Electron.Event) => {
            event.returnValue = mmutils.generateModuleManagerConstructorOptions(this.moduleManager);
        });

        this.browserWindow.loadURL(resolve("index.html"));

        this.browserWindow.once("ready-to-show", async () => {

            this.browserWindow.webContents.openDevTools();
            this.browserWindow.show();

            this.communicator = await sfxModuleManager.getComponentAsync("ipc.communicator", this.browserWindow.webContents);
            await this.communicator.sendAsync("//index-window", this.components);

            let contents = webContents.getAllWebContents();
            let c2 = await sfxModuleManager.getComponentAsync("ipc.communicator", webContents.fromId(3));
            const pattern = await sfxModuleManager.getComponentAsync("remoting.pattern.string", "//index-window/components/cluster-list-button.click");
            const onClusterButtonClicked = async (communicator: ICommunicator, path: string, msg: any): Promise<any> => {
                console.log(msg);
                return Promise.resolve();
            };

            c2.map(pattern, onClusterButtonClicked);
        });
    }
}
