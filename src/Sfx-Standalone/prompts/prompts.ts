//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as util from "util";

import electron from "../utilities/electronAdapter";
import { local } from "../utilities/resolve";
import { IPromptOptions, CommunicatorChannelName, EventNames } from "./prompts.common";
import env from "../utilities/env";
import { getEither } from "../utilities/typeUtil";
import { prepareData, Communicator } from "../utilities/p2pcom";

export default function open<TPromptResults>(
    promptOptions: IPromptOptions,
    promptCallback: (error: any, results: TPromptResults) => void = null): void {

    let promptWindow = new electron.BrowserWindow({
        frame: getEither(promptOptions.frame, true),
        minimizable: getEither(promptOptions.minimizable, false),
        closable: getEither(promptOptions.closable, true),
        show: false,
        modal: true,
        fullscreenable: false,
        useContentSize: true,
        resizable: getEither(promptOptions.resizable, false),
        parent: getEither(promptOptions.parentWindow, null),
        icon: getEither(promptOptions.icon, env.getIconPath())
    });

    promptWindow.setMenuBarVisibility(getEither(promptOptions.showMenu, true));
    promptWindow.setMenu(getEither(promptOptions.menu, env.getDefaultMenu()));

    // Size has to be set after menu settings applied, otherwise the size will be inaccurate.
    promptWindow.setContentSize(getEither(promptOptions.width, 640), getEither(promptOptions.height, 480));

    promptWindow.once("ready-to-show", () => {
        promptWindow.show();
    });

    promptWindow.webContents.once("crashed", (event, killed) => {
        promptCallback("crashed", null);

        if (!killed && !promptWindow.isDestroyed()) {
            promptWindow.destroy();
        }
    });

    prepareData(promptWindow.id, promptOptions);

    let communictor = new Communicator(CommunicatorChannelName, promptWindow.id);

    communictor.handle(EventNames.Finished, (args: any) => {
        if (promptCallback) {
            promptCallback(null, args);
        }
    });

    promptWindow.loadURL(promptOptions.pageUrl, promptOptions.loadUrlOptions);
}
