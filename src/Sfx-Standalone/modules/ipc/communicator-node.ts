//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { ChildProcess } from "child_process";
import { Socket } from "net";
import * as uuidv4 from "uuid/v4";

import * as utils from "../../utilities/utils";
import error from "../../utilities/errorUtil";
import { isRegExp } from "util";

interface IMessage {
    id: string;
    succeeded: boolean;
    path?: string;
    body?: any;
}

interface IPromiseResolver {
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
}

interface IPattern {
    match(path: string): boolean;
    equals(pattern: any): boolean;
}

interface IRoute {
    pattern: IPattern;
    handler: RequestHandler;
}

class StringPattern implements IPattern {
    private readonly pattern: string;

    constructor(pattern: string) {
        this.pattern = pattern;
    }

    public equals(pattern: any): boolean {
        return pattern === this.pattern;
    }

    public match(path: string): boolean {
        return this.pattern === path;
    }
}

class RegexPattern implements IPattern {
    private readonly pattern: RegExp;

    constructor(pattern: RegExp) {
        this.pattern = pattern;
    }

    public equals(pattern: any): boolean {
        return pattern === this.pattern;
    }

    public match(path: string): boolean {
        return this.pattern.test(path);
    }
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

    private routes: Array<IRoute>;

    private disposing: () => void;

    private sendMessage: (msg: IMessage) => boolean;

    private channelDataHandler: (data: any) => void;

    constructor(
        channel: NodeJS.Process | ChildProcess | Socket,
        id?: string) {

        if (utils.isNullOrUndefined(channel)) {
            throw error("channel must be supplied.");
        } else if (isProcess(channel)) {
            this.sendMessage = (msg) => channel.send(msg);
            this.channelDataHandler = (data) => {
                if (isMessage(data)) {
                    this.onMessageAsync(data);
                }
            };
            this.disposing = () => channel.removeListener("message", this.channelDataHandler);

            channel.on("message", this.channelDataHandler);
        } else if (isSocket(channel)) {
            this.sendMessage = (msg) => channel.write(JSON.stringify(msg));
            this.channelDataHandler = (data) => {
                if (String.isString(data)) {
                    try {
                        const msg = JSON.parse(data);

                        if (isMessage(msg)) {
                            this.onMessageAsync(msg);
                        }
                    } catch { }
                }
            };
            this.disposing = () => channel.removeListener("data", this.channelDataHandler);

            channel.on("data", this.channelDataHandler);
        } else {
            throw error("Unknown channel type. Only supports NodeJS.Process, NodeJS.ChildProcess, NodeJS.Socket.");
        }

        this.routes = [];
        this.ongoingPromiseDict = {};
        this.id = String.isNullUndefinedOrWhitespace(id) ? uuidv4() : id;
    }

    public map(pattern: string | RegExp, handler: RequestHandler): void {
        this.validateDisposal();

        if (!Function.isFunction(handler)) {
            throw error("handler must be a function.");
        }

        let route: IRoute = {
            pattern: undefined,
            handler: handler
        };

        if (utils.isNullOrUndefined(pattern)) {
            throw error("pattern must be supplied.");
        } else if (String.isString(pattern)) {
            route.pattern = new StringPattern(pattern);
        } else if (pattern instanceof RegExp) {
            route.pattern = new RegexPattern(pattern);
        } else {
            throw error("Only string and regex pattern are supported.");
        }

        this.routes.push(route);
    }

    public unmap(pattern: string | RegExp): RequestHandler {
        this.validateDisposal();

        if (utils.isNullOrUndefined(pattern)) {
            throw error("pattern must be supplied.");
        }

        const routeIndex = this.routes.findIndex((route) => route.pattern.equals(pattern));

        if (routeIndex < 0) {
            return undefined;
        }

        const handler = this.routes[routeIndex].handler;

        this.routes.splice(routeIndex, 1);

        return handler;
    }

    public sendAsync<TRequest, TResponse>(path: string, content: TRequest): Promise<TResponse> {
        this.validateDisposal();

        if (String.isNullUndefinedOrWhitespace(path)) {
            throw error("path must be a string and not empty/whitespaces.");
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

    public get disposed(): boolean {
        return this.disposing === undefined;
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
        this.routes = undefined;
        this.ongoingPromiseDict = undefined;
    }

    private validateDisposal(): void {
        if (this.disposed) {
            throw error("Communicator ({}) already disposed.", this.id);
        }
    }

    private async onMessageAsync(msg: IMessage): Promise<void> {
        const promise = this.ongoingPromiseDict[msg.id];

        if (!utils.isNullOrUndefined(promise)) {
            delete this.ongoingPromiseDict[msg.id];

            if (msg.succeeded === true) {
                promise.resolve(msg.body);
            } else {
                promise.reject(msg.body);
            }
        } else {
            const route = this.routes.find((route) => route.pattern.match(msg.path));

            if (route !== undefined) {
                let response: any;
                let succeeded: boolean;

                try {
                    response = await route.handler(this, msg.path, msg.body);
                    succeeded = true;
                } catch (exception) {
                    response = exception;
                    succeeded = false;
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
    }
}
