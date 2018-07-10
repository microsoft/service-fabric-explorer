//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IMessage } from "../common";
import { ChildProcess } from "child_process";

import * as utils from "../../../utilities/utils";
import ChannelProxyBase from "./channel-proxy-base";

export default class ProcessChannelProxy extends ChannelProxyBase<ChildProcess> {
    // Process and ChildProcess share the same functions but ChildProcess has more detailed type information.
    //
    // Process:
    // https://nodejs.org/docs/latest-v8.x/api/process.html#process_process_send_message_sendhandle_options_callback
    // https://nodejs.org/docs/latest-v8.x/api/process.html#process_event_message
    //
    // ChildProcess:
    // https://nodejs.org/docs/latest-v8.x/api/child_process.html#child_process_event_message
    // https://nodejs.org/docs/latest-v8.x/api/child_process.html#child_process_subprocess_send_message_sendhandle_options_callback
    public static isValidChannel(channel: any): channel is ChildProcess {
        return !utils.isNullOrUndefined(channel)
            && Function.isFunction(channel.kill)
            && Number.isNumber(channel.pid)
            && Function.isFunction(channel.send)
            && Function.isFunction(channel.on)
            && Function.isFunction(channel.removeListener);
    }

    public disposeAsync(): Promise<void> {
        if (!this.disposed) {
            this.channel.removeListener("message", this.onMessage);
        }

        return super.disposeAsync();
    }

    public sendMessage(msg: IMessage): boolean {
        if (this.disposed) {
            throw new Error("Channel proxy already disposed.");
        }

        return this.channel.send(JSON.stringify(msg));
    }

    constructor(channel: ChildProcess) {
        super(channel);

        this.channel.on("message", this.onMessage);
    }

    private onMessage = (message) => {
        this.triggerDataHandler(this.channel, JSON.parse(message));
    }
}
