//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { MenuItemConstructorOptions, Menu, app, BrowserWindow, ipcMain, BrowserWindowConstructorOptions } from "electron";

import { IPromptOptions, IPromptService } from "../../@types/prompt";
import * as utils from "../../utilities/utils";
import { electron } from "../../utilities/electron-adapter";
import { env, Platform } from "../../utilities/env";
import * as appUtils from "../../utilities/appUtils";
import error from "../../utilities/errorUtil";
import { local } from "../../utilities/resolve";
import { appCodeName } from "../../utilities/appUtils";

export enum EventNames {
    RequestPromptOptions = "request-prompt-options",
    Finished = "finished"
}

export const ChannelNameFormat = appCodeName + "/prompt/{}";

export class PromptService implements IPromptService {
    private readonly moduleManager: IModuleManager;

    constructor(moduleManager: IModuleManager) {
        if (!Object.isObject(moduleManager)) {
            throw error("valid moduleManager must be supplied.");
        }

        this.moduleManager = moduleManager;
    }

    public open<TPromptResults>(
        promptOptions: IPromptOptions,
        promptCallback: (error: any, results: TPromptResults) => void = null): ICommunicator {

        const promptWindow: BrowserWindow =
            this.moduleManager.getComponent(
                "browser-window",
                <BrowserWindowConstructorOptions>{
                    frame: utils.getEither(promptOptions.frame, true),
                    maximizable: false,
                    minimizable: utils.getEither(promptOptions.minimizable, false),
                    closable: utils.getEither(promptOptions.closable, true),
                    show: false,
                    modal: true,
                    fullscreenable: false,
                    useContentSize: true,
                    resizable: utils.getEither(promptOptions.resizable, false),
                    parent: promptOptions.parentWindowId ? electron.BrowserWindow.fromId(promptOptions.parentWindowId) : null,
                    icon: utils.getEither(promptOptions.icon, appUtils.getIconPath()),
                    webPreferences: {
                        preload: local("./preload.js")
                    }
                });

        promptOptions.showMenu = utils.getEither(promptOptions.showMenu, false);
        promptWindow.setMenuBarVisibility(promptOptions.showMenu);

        if (promptOptions.showMenu && Object.isObject(promptOptions.menuTemplate)) {
            if (env.platform !== Platform.MacOs) {
                promptWindow.setMenu(Menu.buildFromTemplate(promptOptions.menuTemplate));
            } else {
                Menu.setApplicationMenu(Menu.buildFromTemplate(promptOptions.menuTemplate));
            }
        }

        // Size has to be set after menu settings applied, otherwise the size will be inaccurate.
        promptWindow.setContentSize(utils.getEither(promptOptions.width, 640), utils.getEither(promptOptions.height, 480));

        promptWindow.once("ready-to-show", () => {
            promptWindow.show();
        });

        promptWindow.webContents.once("crashed", (event, killed) => {
            if (Function.isFunction(promptCallback)) {
                promptCallback("crashed", null);
            }

            if (!killed && !promptWindow.isDestroyed()) {
                promptWindow.destroy();
            }
        });

        const communicator: ICommunicator =
            this.moduleManager.getComponent("ipc-communicator-electron", promptWindow.webContents.id, String.format(ChannelNameFormat, promptWindow.webContents.id));

        communicator.once(EventNames.RequestPromptOptions, () => promptOptions);

        communicator.on(EventNames.Finished, (responser, data: any) => {
            if (Function.isFunction(promptCallback)) {
                promptCallback(null, data);
            }
        });

        promptWindow.loadURL(promptOptions.pageUrl);

        return communicator;
    }
}
