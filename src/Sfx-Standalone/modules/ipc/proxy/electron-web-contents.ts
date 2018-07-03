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

    private channelClient: electron.WebContents;
    private channelServer: electron.IpcMain | electron.IpcRenderer;

    public get disposed(): boolean {
        return this.channelClient === undefined;
    }

    public static isValidChannel(channel: any): channel is electron.WebContents {
        return !utils.isNullOrUndefined(channel)
            && Function.isFunction(channel.executeJavaScript)
            && Function.isFunction(channel.setAudioMuted)
            && Function.isFunction(channel.setZoomFactor)
            && Function.isFunction(channel.findInPage)
            && Function.isFunction(channel.send);
    }

    public dispose(): void {
        super.dispose();

        if (!this.disposed) {
            this.channelServer.removeListener(this.channelName, this.onChannelData);

            this.channelServer = undefined;
            this.channelClient = undefined;
        }
    }

    public sendMessage(msg: IMessage): boolean {
        if (this.disposed) {
            throw new Error("Channel proxy already disposed.");
        }

        this.channelClient.send(this.channelName, msg);
        return true;
    }

    constructor(channel: electron.WebContents) {
        super();

        this.channelClient = channel;
        this.channelServer = electron.ipcMain || electron.ipcRenderer;
        this.channelName = uuidv5(channel.id.toString(), UuidNamespace);

        this.channelServer.on(this.channelName, this.onChannelData);
    }

    private onChannelData = (event: electron.Event, data: any): void => {
        this.triggerDataHandler(data);
    }
}
