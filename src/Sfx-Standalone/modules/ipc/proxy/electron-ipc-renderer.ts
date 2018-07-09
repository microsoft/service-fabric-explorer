//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IMessage, UuidNamespace } from "../common";

import * as electron from "electron";
import * as uuidv5 from "uuid/v5";
import * as utils from "../../../utilities/utils";
import ChannelProxyBase from "./channel-proxy-base";

export default class ElectronIpcRendererChannelProxy extends ChannelProxyBase<electron.IpcRenderer> {
    private readonly channelName: string;

    private readonly windowId: number;

    public static isValidChannel(channel: any): channel is electron.IpcRenderer {
        return !utils.isNullOrUndefined(channel)
            && channel === electron.ipcRenderer;
    }

    public dispose(): void {
        if (!this.disposed) {
            this.channel.removeListener(this.channelName, this.onChannelData);
        }

        super.dispose();
    }

    public sendMessage(msg: IMessage): boolean {
        if (this.disposed) {
            throw new Error("Channel proxy already disposed.");
        }

        if (this.windowId === -2) {
            this.channel.send(this.channelName, JSON.stringify(msg));
        } else if (this.windowId === -1) {
            this.channel.sendToHost(this.channelName, JSON.stringify(msg));
        } else {
            this.channel.sendTo(this.windowId, this.channelName, JSON.stringify(msg));
        }

        return true;
    }

    constructor(channel: electron.IpcRenderer, channelName?: string, windowId?: number) {
        super(channel);

        if (!utils.isNullOrUndefined(windowId)
            && !Number.isSafeInteger(windowId)) {
            throw new Error("Given windowId must be a safe integer.");
        }

        if (utils.isNullOrUndefined(windowId)) {
            const currentWindow = electron.remote.getCurrentWindow();
            const currentWebContents = electron.remote.getCurrentWebContents();

            // If the current WebContents is the same as the WebContents of the current window,
            // Then the target windowId will be main process,
            // Else the target windowId will be the current window (parent).
            windowId = currentWindow.webContents.id === currentWebContents.id ? -2 : currentWindow.id;
        }

        if (windowId < -2) {
            throw new Error("Given windowId must be greater than or equal to -2.");
        }

        this.windowId = windowId;
        this.channelName = channelName || uuidv5(electron.remote.getCurrentWebContents().id.toString(), UuidNamespace);

        this.channel.on(this.channelName, this.onChannelData);
    }

    private onChannelData = (event: electron.Event, data: any) => {
        this.triggerDataHandler(event.sender, JSON.parse(data));
    }
}
