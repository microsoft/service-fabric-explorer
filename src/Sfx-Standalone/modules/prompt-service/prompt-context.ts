//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IPromptOptions } from "../../@types/prompt";
import { IPromptContext } from "../../@types/prompt-window";
import { ICommunicator } from "../../@types/ipc";
import { remote, electron } from "../../utilities/electron-adapter";
import ElectronCommunicator from "../../modules/ipc/communicator-electron";
import { EventNames, ChannelNameFormat } from "./prompt-service";

export class PromptContext implements IPromptContext {
    private static promptContext: PromptContext;

    private readonly options: IPromptOptions;

    private readonly promptWindow: Electron.BrowserWindow;

    private readonly communicator: ICommunicator;

    private finished: boolean;

    public finish<TPromptResults>(results: TPromptResults): void {
        this.triggerFinishEvent(results);
        this.promptWindow.close();
    }

    public close(): void {
        this.finish(null);
    }

    constructor() {
        this.promptWindow = remote.getCurrentWindow();
        this.finished = false;
        this.communicator = new ElectronCommunicator(null, String.format(ChannelNameFormat, this.promptWindow.webContents.id));
        this.options = this.communicator.sendSync(EventNames.RequestPromptOptions, null);
        
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
            this.communicator.send(EventNames.Finished, results);
        }
    }
}
