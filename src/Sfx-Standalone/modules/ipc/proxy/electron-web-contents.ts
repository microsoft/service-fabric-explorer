//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IMessage, UuidNamespace } from "../common";

import * as electron from "electron";
import * as uuidv5 from "uuid/v5";
import * as utils from "../../../utilities/utils";
import ChannelProxyBase from "./channel-proxy-base";

export default class ElectronWebContentsChannelProxy extends ChannelProxyBase {
    private readonly channelName: string;

    private channel: electron.WebContents;

    public get disposed(): boolean {
        return this.channel === undefined;
    }

    public static isValidChannel(channel: any): channel is electron.WebContents {
        return !utils.isNullOrUndefined(channel)
            && !utils.isNullOrUndefined(electron.ipcMain)
            && Function.isFunction(channel.executeJavaScript)
            && Function.isFunction(channel.setAudioMuted)
            && Function.isFunction(channel.setZoomFactor)
            && Function.isFunction(channel.findInPage)
            && Function.isFunction(channel.send);
    }

    public dispose(): void {
        super.dispose();

        if (!this.disposed) {
            electron.ipcMain.removeListener(this.channelName, this.onChannelData);

            this.channel = undefined;
        }
    }

    public sendMessage(msg: IMessage): boolean {
        if (this.disposed) {
            throw new Error("Channel proxy already disposed.");
        }

        this.channel.send(this.channelName, msg);
        return true;
    }

    constructor(channel: electron.WebContents) {
        super();

        this.channel = channel;
        this.channelName = uuidv5(channel.id.toString(), UuidNamespace);

        electron.ipcMain.on(this.channelName, this.onChannelData);
    }

    private onChannelData = (event: electron.Event, data: any): void => {
        this.triggerDataHandler(data);
    }
}
