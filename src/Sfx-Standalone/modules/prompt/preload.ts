//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { PromptContext } from "./prompt-context";
import { electron } from "../../utilities/electron-adapter";
import * as mmutils from "../../module-manager/utils";
import { Communicator } from "../ipc/communicator";
import * as utils from "../../utilities/utils";
import { ChannelNameFormat, EventNames } from "./constants";

process.once("loaded", async () => {
    const promptWindow = electron.remote.getCurrentWindow();
    const constructorOptions =
        electron.ipcRenderer.sendSync(utils.format(ChannelNameFormat, promptWindow.id, EventNames.RequestModuleManagerConstructorOptions));

    global["sfxModuleManager"] = await mmutils.createModuleManagerAsync(constructorOptions, new Communicator(electron.ipcRenderer));

    sfxModuleManager.registerComponents([
        {
            name: "prompt.prompt-context",
            version: electron.app.getVersion(),
            singleton: true,
            descriptor: () => new PromptContext()
        }
    ]);
});
