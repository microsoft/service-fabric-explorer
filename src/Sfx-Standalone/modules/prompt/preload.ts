//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as utils from "../../utilities/utils";

import { PromptContext } from "./prompt-context";
import * as appUtils from "../../utilities/appUtils";
import { electron } from "../../utilities/electron-adapter";
import * as mmutils from "../../module-manager/utils";
import { Communicator } from "../ipc/communicator";
import { ChannelNameFormat, EventNames } from "./constants";

// TODO: Remove global.exports when the node v10 is integrated with electron.
global["exports"] = exports;

process.on("unhandledRejection", (reason, promise) => {
    console.log("Unhandled promise rejection: ", promise);
    console.log("  reason: ", reason);

    if (sfxModuleManager) {
        sfxModuleManager.getComponentAsync("logging")
            .then((log) => {
                if (log) {
                    log.writeError("Unhandled promise rejection: {}", reason);
                }
            });
    }
});

process.once("loaded", async () => {
    const promptWindow = electron.remote.getCurrentWindow();
    const constructorOptions =
        electron.ipcRenderer.sendSync(utils.format(ChannelNameFormat, promptWindow.id, EventNames.RequestModuleManagerConstructorOptions));

    global["sfxModuleManager"] = await mmutils.createModuleManagerAsync(constructorOptions, new Communicator(electron.ipcRenderer));

    sfxModuleManager.registerComponents([
        {
            name: "prompt.prompt-context",
            version: appUtils.getAppVersion(),
            singleton: true,
            descriptor: () => new PromptContext()
        }
    ]);
});
