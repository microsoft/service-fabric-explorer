//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { ChildProcess } from "child_process";
import { Socket } from "net";
import * as uuidv4 from "uuid/v4";

import * as utils from "../../utilities/utils";
import error from "../../utilities/errorUtil";

interface IMessage {
    id: string;
    succeeded: boolean,
    path?: string;
    body?: any;
}

interface IPromiseResolver {
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
}

// Process and ChildProcess share the same functions but ChildProcess has more detailed type information.
//
// Process:
// https://nodejs.org/docs/latest-v8.x/api/process.html#process_process_send_message_sendhandle_options_callback
// https://nodejs.org/docs/latest-v8.x/api/process.html#process_event_message
//
// ChildProcess:
// https://nodejs.org/docs/latest-v8.x/api/child_process.html#child_process_event_message
// https://nodejs.org/docs/latest-v8.x/api/child_process.html#child_process_subprocess_send_message_sendhandle_options_callback
function isProcess(channel: any): channel is ChildProcess {
    return !utils.isNullOrUndefined(channel)
        && Function.isFunction(channel.send)
        && Function.isFunction(channel.on)
        && Function.isFunction(channel.removeListener);
}

function isSocket(channel: any): channel is Socket {
    return !utils.isNullOrUndefined(channel)
        && Function.isFunction(channel.write)
        && Function.isFunction(channel.on)
        && Function.isFunction(channel.removeListener);
}

function isMessage(msg: any): msg is IMessage {
    return !utils.isNullOrUndefined(msg)
        && !String.isNullUndefinedOrWhitespace(msg.id)
        && (utils.isNullOrUndefined(msg.path) || String.isString(msg.path));
}

class NodeCommunicator implements ICommunicator {
    public readonly id: string;

    private ongoingPromiseDict: IDictionary<IPromiseResolver>;

    private requestHandler: RequestHandler;

    private disposing: () => void;

    private sendMessage: (msg: IMessage) => boolean;

    private channelDataHandler: (data: any) => void;

    private onMessage(msg: IMessage): void {
        const promise = this.ongoingPromiseDict[msg.id];

        if (!utils.isNullOrUndefined(promise)) {
            delete this.ongoingPromiseDict[msg.id];

            if (msg.succeeded === true) {
                promise.resolve(msg.body);
            }
            else {
                promise.reject(msg.body);
            }
        }
        else if (!utils.isNullOrUndefined(this.requestHandler)) {
            let response: any;
            let succeeded: boolean = false;

            try {
                response = this.requestHandler(msg.path, msg.body);
                succeeded = true;
            } catch (error) {
                response = error;
            }

            if (!this.sendMessage({
                id: uuidv4(),
                path: msg.path,
                succeeded: succeeded,
                body: response
            })) {
                // Log if failed.
            }
        }
    }

    constructor(
        channel: NodeJS.Process | ChildProcess | Socket,
        id?: string,
        requestHandler?: RequestHandler) {

        if (!utils.isNullOrUndefined(requestHandler) && !Function.isFunction(requestHandler)) {
            throw error("requestHandler must be a function.");
        }

        if (utils.isNullOrUndefined(channel)) {
            throw error("channel must be supplied.");
        }
        else if (isProcess(channel)) {
            this.sendMessage = (msg) => channel.send(msg);
            this.channelDataHandler = (data) => {
                if (isMessage(data)) {
                    this.onMessage(data);
                }
            };
            this.disposing = () => channel.removeListener("message", this.channelDataHandler);

            channel.on("message", this.channelDataHandler);
        }
        else if (isSocket(channel)) {
            this.sendMessage = (msg) => channel.write(JSON.stringify(msg));
            this.channelDataHandler = (data) => {
                if (String.isString(data)) {
                    try {
                        const msg = JSON.parse(data);

                        if (isMessage(msg)) {
                            this.onMessage(msg);
                        }
                    } catch { }
                }
            };
            this.disposing = () => channel.removeListener("data", this.channelDataHandler);

            channel.on("data", this.channelDataHandler);
        }
        else {
            throw error("Unknown channel type. Only supports NodeJS.Process, NodeJS.ChildProcess, NodeJS.Socket.");
        }

        this.requestHandler = requestHandler;
        this.ongoingPromiseDict = {};
        this.id = String.isNullUndefinedOrWhitespace(id) ? uuidv4() : id;
    }

    public getRequestHandler(): RequestHandler {
        if (this.disposing === undefined) {
            throw error("Communicator ({}) already disposed.", this.id);
        }

        return this.requestHandler;
    }

    public setRequestHandler(handler: RequestHandler): void {
        if (this.disposing === undefined) {
            throw error("Communicator ({}) already disposed.", this.id);
        }

        if (!utils.isNullOrUndefined(handler) && !Function.isFunction(handler)) {
            throw error("handler must be a function.");
        }

        this.requestHandler = handler;
    }

    public sendAsync<TRequest, TResponse>(path: string, content: TRequest): Promise<TResponse> {
        if (this.disposing === undefined) {
            throw error("Communicator ({}) already disposed.", this.id);
        }

        if (!utils.isNullOrUndefined(path)) {
            if (!String.isString(path)) {
                throw error("path must be a string.");
            }
        }

        return new Promise((resolve, reject) => {
            const msg: IMessage = {
                id: uuidv4(),
                path: path,
                succeeded: true,
                body: content
            };

            if (!this.sendMessage(msg)) {
                reject(error("Failed to send request. The remote channel may be closed."));
                return;
            }

            this.ongoingPromiseDict[msg.id] = {
                resolve: resolve,
                reject: reject
            };
        });
    }

    public dispose(): void {
        if (this.disposing !== undefined) {
            this.disposing();
        }

        if (this.ongoingPromiseDict !== undefined) {
            Object.values(this.ongoingPromiseDict).forEach((resolver) => resolver.reject(error("Communicator ({}) is disposed.", this.id)));
        }

        this.sendMessage = undefined;
        this.channelDataHandler = undefined;
        this.disposing = undefined;
        this.requestHandler = undefined;
        this.ongoingPromiseDict = undefined;
    }
}