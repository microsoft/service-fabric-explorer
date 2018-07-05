//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IMessage } from "../common";
import { Socket } from "net";

import * as utils from "../../../utilities/utils";
import ChannelProxyBase from "./channel-proxy-base";

export default class SocketChannelProxy extends ChannelProxyBase {
    private channel: Socket;

    public get disposed(): boolean {
        return this.channel === undefined;
    }

    public static isValidChannel(channel: any): channel is Socket {
        return !utils.isNullOrUndefined(channel)
            && Function.isFunction(channel.write)
            && Function.isFunction(channel.on)
            && Function.isFunction(channel.removeListener);
    }

    public dispose(): void {
        if (!this.disposed) {
            this.channel.removeListener("data", this.onChannelData);

            this.channel = undefined;
            this.dataHandler = undefined;
        }
    }

    public sendMessage(msg: IMessage): boolean {
        if (this.disposed) {
            throw new Error("Channel proxy already disposed.");
        }

        return this.channel.write(JSON.stringify(msg));
    }

    constructor(channel: Socket) {
        super();

        this.channel = channel;
        
        this.channel.on("data", this.onChannelData);
    }

    private onChannelData = (data: Buffer) => {
        if (String.isString(data)) {
            try {
                this.triggerDataHandler(JSON.parse(data));
            } catch { }
        }
    }
}
