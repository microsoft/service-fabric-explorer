//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IModuleManager } from "sfx";
import { IPrompt, IPromptService, IPromptOptions } from "sfx.prompt";

import { Menu, BrowserWindow, ipcMain, BrowserWindowConstructorOptions } from "electron";

import * as utils from "../../utilities/utils";
import { electron } from "../../utilities/electron-adapter";
import { env, Platform } from "../../utilities/env";
import * as appUtils from "../../utilities/appUtils";
import { local } from "../../utilities/resolve";
import * as mmutils from "../../module-manager/utils";
import { ChannelNameFormat, EventNames } from "./constants";

class Prompt<TResult> implements IPrompt<TResult> {
    public get disposed(): boolean {
        return this.promise === undefined;
    }

    private readonly moduleManager: IModuleManager;
    private readonly promptOptions: IPromptOptions;

    private promise: Promise<TResult>;
    private promise_resolve: (result: TResult) => void;
    private promise_reject: (reason?: any) => void;
    private promptWindow: BrowserWindow;
    private promptResult: TResult;

    constructor(moduleManager: IModuleManager, promptOptions: IPromptOptions) {
        this.moduleManager = moduleManager;
        this.promptOptions = promptOptions;
        this.promise = new Promise((resolve, reject) => {
            this.promise_reject = reject;
            this.promise_resolve = resolve;
        });
    }

    public async initializeAsync(): Promise<void> {
        this.validateDisposal();

        this.promptWindow =
            await this.moduleManager.getComponentAsync(
                "browser-window",
                <BrowserWindowConstructorOptions>{
                    frame: utils.getValue(this.promptOptions.frame, true),
                    maximizable: false,
                    minimizable: utils.getValue(this.promptOptions.minimizable, false),
                    closable: utils.getValue(this.promptOptions.closable, true),
                    show: false,
                    modal: true,
                    fullscreenable: false,
                    useContentSize: true,
                    resizable: utils.getValue(this.promptOptions.resizable, false),
                    parent: this.promptOptions.parentWindowId ? electron.BrowserWindow.fromId(this.promptOptions.parentWindowId) : null,
                    icon: utils.getValue(this.promptOptions.icon, appUtils.getIconPath()),
                    webPreferences: {
                        preload: local("./preload.js")
                    }
                });

        this.promptOptions.showMenu = utils.getValue(this.promptOptions.showMenu, false);
        this.promptWindow.setMenuBarVisibility(this.promptOptions.showMenu);

        if (this.promptOptions.showMenu && Object.isObject(this.promptOptions.menuTemplate)) {
            if (env.platform !== Platform.MacOs) {
                this.promptWindow.setMenu(Menu.buildFromTemplate(this.promptOptions.menuTemplate));
            } else {
                Menu.setApplicationMenu(Menu.buildFromTemplate(this.promptOptions.menuTemplate));
            }
        }

        // Size has to be set after menu settings applied, otherwise the size will be inaccurate.
        this.promptWindow.setContentSize(utils.getValue(this.promptOptions.width, 640), utils.getValue(this.promptOptions.height, 480));

        this.promptWindow.once("ready-to-show", () => {
            this.promptWindow.show();
        });

        this.promptWindow.webContents.once("crashed", (event, killed) => {
            if (!killed && !this.promptWindow.isDestroyed()) {
                this.promptWindow.destroy();
            }

            this.cleanupIpcListeners();
            this.promise_reject("crashed");
        });

        this.promptWindow.on("close", (event) => {
            this.cleanupIpcListeners();
            this.promise_resolve(this.promptResult);
        });

        ipcMain.once(
            utils.format(ChannelNameFormat, this.promptWindow.id, EventNames.RequestModuleManagerConstructorOptions),
            (event: Electron.Event) => event.returnValue = mmutils.generateModuleManagerConstructorOptions(this.moduleManager));

        ipcMain.once(
            utils.format(ChannelNameFormat, this.promptWindow.id, EventNames.Finished),
            (event: Electron.Event, result: any) => this.promptResult = result);

        ipcMain.once(
            utils.format(ChannelNameFormat, this.promptWindow.id, EventNames.RequestPromptOptions),
            (event: Electron.Event) => event.returnValue = this.promptOptions);
    }

    public openAsync(): Promise<TResult> {
        this.validateDisposal();

        if (!this.promptWindow) {
            throw new Error("Prompt is not initialized.");
        }

        this.promptWindow.loadURL(this.promptOptions.pageUrl);
        return this.promise;
    }

    public dispose(): void {
        this.promise = undefined;
        this.promise_reject = undefined;
        this.promise_resolve = undefined;
        this.promptWindow = undefined;
        this.promptResult = undefined;
    }

    private cleanupIpcListeners() {
        for (const eventName in EventNames) {
            ipcMain.removeAllListeners(utils.format(ChannelNameFormat, this.promptWindow.id, eventName));
        }
    }

    private validateDisposal(): void {
        if (this.disposed) {
            throw new Error("Prompt already disposed.");
        }
    }
}

export class PromptService implements IPromptService {
    private readonly moduleManager: IModuleManager;

    constructor(moduleManager: IModuleManager) {
        if (!Object.isObject(moduleManager)) {
            throw new Error("valid moduleManager must be supplied.");
        }

        this.moduleManager = moduleManager;
    }

    public async createAsync<TResult>(promptOptions: IPromptOptions): Promise<IPrompt<TResult>> {
        const prompt = new Prompt<TResult>(this.moduleManager, promptOptions);

        await prompt.initializeAsync();

        return prompt;
    }
}
