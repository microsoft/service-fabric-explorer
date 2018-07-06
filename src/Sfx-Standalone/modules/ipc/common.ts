//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IDisposable } from "sfx.common";
import { ChannelType } from "sfx.ipc";

export interface IMessage {
    id: string;
    succeeded?: boolean;
    path?: string;
    body?: any;
}

export interface IChannelProxy extends IDisposable {
    readonly channel: ChannelType;
    
    dispose(): void;
    sendMessage(msg: IMessage): boolean;
    setDataHandler(handler: ChannelProxyDataHandler): void;
}

export interface ChannelProxyDataHandler {
    (channel: ChannelType, data: any): void | Promise<void>;
}

export const UuidNamespace = "65ef6f94-e6c9-4c95-8360-6d29de87b1dd";
