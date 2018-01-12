//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { remote, BrowserWindow, ipcRenderer } from "electron";

import { IPromptOptions, EventNames, CommunicatorChannelName } from "./prompts.common";
import { requestData, Communicator } from "../utilities/p2pcom";

export class PromptContext {
    private static promptContext: PromptContext;

    private readonly options: IPromptOptions;

    private readonly promptWindow: BrowserWindow;

    private readonly communicator: Communicator;

    private finished: boolean;

    public static getInstance(): PromptContext {
        if (!PromptContext.promptContext) {
            PromptContext.promptContext = new PromptContext();
        }

        return PromptContext.promptContext;
    }

    public finish<TPromptResults>(results: TPromptResults): void {
        this.triggerFinishEvent(results);
        this.promptWindow.close();
    }

    public close(): void {
        this.finish(null);
    }

    constructor() {
        this.promptWindow = remote.getCurrentWindow();
        this.options = requestData();
        this.finished = false;
        this.communicator = new Communicator(CommunicatorChannelName);

        this.promptWindow.on("close",
            (event) => {
                event.preventDefault();
            });
    }

    public get promptOptions(): IPromptOptions {
        return this.options;
    }

    private triggerFinishEvent<TPromptResults>(results: TPromptResults): void {
        if (!this.finished) {
            this.finished = true;
            this.communicator.emit(EventNames.Finished, results);
        }
    }
}
