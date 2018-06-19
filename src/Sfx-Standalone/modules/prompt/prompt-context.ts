//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import {
    IPromptContext,
    IPromptOptions
} from "sfx.prompt";

import { remote } from "../../utilities/electron-adapter";
import * as utils from "../../utilities/utils";
import { EventNames, ChannelNameFormat } from "./constants";
import { ipcRenderer } from "electron";

export class PromptContext implements IPromptContext {
    private static promptContext: PromptContext;

    private readonly options: IPromptOptions;

    private readonly promptWindow: Electron.BrowserWindow;

    public finish<TPromptResults>(results: TPromptResults): void {
        ipcRenderer.send(utils.format(ChannelNameFormat, this.promptWindow.id, EventNames.Finished), results);
        this.promptWindow.close();
    }

    constructor() {
        this.promptWindow = remote.getCurrentWindow();
        this.options = ipcRenderer.sendSync(utils.format(ChannelNameFormat, this.promptWindow.id, EventNames.RequestPromptOptions));
    }

    public get promptOptions(): IPromptOptions {
        return this.options;
    }
}
