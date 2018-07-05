//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IChannelProxy, ChannelProxyDataHandler, IMessage } from "../common";

export default abstract class ChannelProxyBase implements IChannelProxy {
    protected dataHandler: ChannelProxyDataHandler;

    public abstract get disposed(): boolean;

    public dispose(): void {
        this.dataHandler = undefined;
    }

    public abstract sendMessage(msg: IMessage): boolean;

    public setDataHandler(handler: ChannelProxyDataHandler): void {
        this.dataHandler = handler;
    }

    protected triggerDataHandler(data: any): void {
        if (Function.isFunction(this.dataHandler)) {
            this.dataHandler(data);
        }
    }
}
