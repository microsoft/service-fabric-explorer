//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IMessage, UuidNamespace } from "../common";

import * as electron from "electron";
import * as uuidv5 from "uuid/v5";
import * as utils from "../../../utilities/utils";
import ChannelProxyBase from "./channel-proxy-base";

export default class ElectronWebContentsChannelProxy extends ChannelProxyBase<electron.WebContents> {
    private readonly channelName: string;

    private channelListener: electron.IpcMain | electron.IpcRenderer;

    public static isValidChannel(channel: any): channel is electron.WebContents {
        return !utils.isNullOrUndefined(channel)
            && Function.isFunction(channel.executeJavaScript)
            && Function.isFunction(channel.setAudioMuted)
            && Function.isFunction(channel.setZoomFactor)
            && Function.isFunction(channel.findInPage)
            && Function.isFunction(channel.send);
    }

    public disposeAsync(): Promise<void> {
        if (!this.disposed) {
            this.channelListener.removeListener(this.channelName, this.onChannelData);

            this.channelListener = undefined;
        }

        return super.disposeAsync();
    }

    public sendMessage(msg: IMessage): boolean {
        if (this.disposed) {
            throw new Error("Channel proxy already disposed.");
        }

        this.channel.send(this.channelName, JSON.stringify(msg));
        return true;
    }

    constructor(channel: electron.WebContents, channelName?: string) {
        super(channel);

        this.channelListener = electron.ipcMain || electron.ipcRenderer;
        this.channelName = channelName || uuidv5(channel.id.toString(), UuidNamespace);

        this.channelListener.on(this.channelName, this.onChannelData);
    }

    private onChannelData = (event: electron.Event, data: any): void => {
        this.triggerDataHandler(event.sender, JSON.parse(data));
    }
}
