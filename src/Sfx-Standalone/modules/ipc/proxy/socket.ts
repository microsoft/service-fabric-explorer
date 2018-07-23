//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IMessage } from "../common";
import { Socket } from "net";

import * as utils from "../../../utilities/utils";
import ChannelProxyBase from "./channel-proxy-base";

export default class SocketChannelProxy extends ChannelProxyBase<Socket> {
    public static isValidChannel(channel: any): channel is Socket {
        return !utils.isNullOrUndefined(channel)
            && Function.isFunction(channel.write)
            && Function.isFunction(channel.on)
            && Function.isFunction(channel.removeListener);
    }

    public disposeAsync(): Promise<void> {
        if (!this.disposed) {
            this.channel.removeListener("data", this.onChannelData);
        }

        return super.disposeAsync();
    }

    public sendMessage(msg: IMessage): boolean {
        if (this.disposed) {
            throw new Error("Channel proxy already disposed.");
        }

        return this.channel.write(JSON.stringify(msg));
    }

    constructor(channel: Socket) {
        super(channel);

        this.channel.on("data", this.onChannelData);
    }

    private onChannelData = (data: Buffer) => {
        if (String.isString(data)) {
            try {
                this.triggerDataHandler(this.channel, JSON.parse(data));
            } catch { }
        }
    }
}
