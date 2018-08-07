//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IChannelProxy, ChannelProxyDataHandler, IMessage } from "../common";
import { ChannelType } from "sfx.ipc";

export default abstract class ChannelProxyBase<TChannel extends ChannelType> implements IChannelProxy {
    protected dataHandler: ChannelProxyDataHandler;

    private _channel: TChannel;

    public get channel(): TChannel {
        return this._channel;
    }

    public get disposed(): boolean {
        return this._channel === undefined;
    }

    constructor(channel: TChannel) {
        this._channel = channel;
    }

    public disposeAsync(): Promise<void> {
        this.dataHandler = undefined;
        this._channel = undefined;

        return Promise.resolve();
    }

    public abstract sendMessage(msg: IMessage): boolean;

    public setDataHandler(handler: ChannelProxyDataHandler): void {
        if (this.disposed
            && handler !== undefined
            && handler !== null) {
            throw new Error("Channel proxy already disposed.");
        }

        this.dataHandler = handler;
    }

    protected triggerDataHandler(channel: ChannelType, data: any): void {
        if (Function.isFunction(this.dataHandler)) {
            this.dataHandler(channel, data);
        }
    }
}
