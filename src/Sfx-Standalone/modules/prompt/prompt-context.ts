//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import {
    IPromptContext,
    IPromptOptions
} from "sfx.prompt";

import * as utils from "donuts.node/utils";
import { EventNames, ChannelNameFormat } from "./constants";
import { ipcRenderer } from "electron";

export class PromptContext implements IPromptContext {
    private readonly options: IPromptOptions;

    private id: string = "";

    public finish<TPromptResults>(results: TPromptResults): void {
        ipcRenderer.send(utils.string.format(ChannelNameFormat, this.id, EventNames.Finished), results);
    }

    constructor() {
        this.id = window.location.search.split("=")[1];
        this.options = ipcRenderer.sendSync(utils.string.format(ChannelNameFormat, this.id, EventNames.RequestPromptOptions));
        console.log(this)
    }

    public get promptOptions(): IPromptOptions {
        return this.options;
    }
}
