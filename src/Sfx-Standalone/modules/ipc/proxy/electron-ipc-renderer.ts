//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IMessage, UuidNamespace } from "../common";

import * as electron from "electron";
import * as uuidv5 from "uuid/v5";
import * as utils from "../../../utilities/utils";
import ChannelProxyBase from "./channel-proxy-base";

export default class ElectronIpcRendererChannelProxy extends ChannelProxyBase {
    private readonly channelName: string;

    private readonly windowId: number;

    private channel: electron.IpcRenderer;

    public get disposed(): boolean {
        return this.channel === undefined;
    }

    public static isValidChannel(channel: any): channel is electron.IpcRenderer {
        return !utils.isNullOrUndefined(channel)
            && channel === electron.ipcRenderer;
    }

    public dispose(): void {
        super.dispose();

        if (!this.disposed) {
            this.channel.removeListener(this.channelName, this.onChannelData);

            this.channel = undefined;
        }
    }

    public sendMessage(msg: IMessage): boolean {
        if (this.disposed) {
            throw new Error("Channel proxy already disposed.");
        }

        if (utils.isNullOrUndefined(this.windowId)) {
            this.channel.send(this.channelName, msg);
        } else if (this.windowId === -1) {
            this.channel.sendToHost(this.channelName, msg);
        } else {
            this.channel.sendTo(this.windowId, this.channelName, msg);
        }

        return true;
    }

    constructor(channel: electron.IpcRenderer, windowId?: number) {
        super();

        if (!utils.isNullOrUndefined(windowId)
            && !Number.isSafeInteger(windowId)) {
            throw new Error("Given windowId must be a safe integer.");
        }

        if (windowId < -2) {
            throw new Error("Given windowId must be greater than or equal to -2.");
        } 

        this.windowId = windowId === -2 ? electron.remote.getCurrentWindow().id : windowId;
        this.channel = channel;
        this.channelName = uuidv5(electron.remote.getCurrentWebContents().id.toString(), UuidNamespace);

        this.channel.on(this.channelName, this.onChannelData);
    }

    private onChannelData = (event: electron.Event, data: any) => {
        this.triggerDataHandler(data);
    }
}
