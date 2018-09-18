//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IDictionary } from "sfx.common";
import { AsyncRequestHandler, ICommunicator, IRoutePattern } from "sfx.remoting";
import { ICommunicatorConstructorOptions, ChannelType } from "sfx.ipc";
import { IChannelProxy, IMessage } from "./common";

import * as uuidv4 from "uuid/v4";

import * as utils from "../../utilities/utils";
import ProcessChannelProxy from "./proxy/process";
import ElectronWebContentsChannelProxy from "./proxy/electron-web-contents";
import ElectronIpcRendererChannelProxy from "./proxy/electron-ipc-renderer";
import SocketChannelProxy from "./proxy/socket";

interface IPromiseResolver {
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
}

interface IRoute {
    pattern: IRoutePattern;
    asyncHandler: AsyncRequestHandler;
}

function generateChannelProxy(channel: any): IChannelProxy {
    if (utils.isNullOrUndefined(channel)) {
        throw new Error("channel must be supplied.");
    } else if (ProcessChannelProxy.isValidChannel(channel)) {
        return new ProcessChannelProxy(channel);

    } else if (ElectronWebContentsChannelProxy.isValidChannel(channel)) {
        return new ElectronWebContentsChannelProxy(channel);

    } else if (ElectronIpcRendererChannelProxy.isValidChannel(channel)) {
        return new ElectronIpcRendererChannelProxy(channel);

    } else if (SocketChannelProxy.isValidChannel(channel)) {
        return new SocketChannelProxy(channel);

    } else {
        throw new Error("Unknown channel type. Only supports NodeJS.Process, NodeJS.ChildProcess, NodeJS.Socket, Electron.IpcRenderer, Electron.WebContents.");
    }
}

export class Communicator implements ICommunicator {
    public readonly id: string;

    private readonly timeout: number;

    private ongoingPromiseDict: IDictionary<IPromiseResolver>;

    private routes: Array<IRoute>;

    private channelProxy: IChannelProxy;

    public static fromChannel(
        channel: ChannelType,
        options?: ICommunicatorConstructorOptions)
        : ICommunicator {
        return new Communicator(generateChannelProxy(channel), options);
    }

    constructor(
        channelProxy: IChannelProxy,
        options?: ICommunicatorConstructorOptions) {
        this.routes = [];
        this.ongoingPromiseDict = Object.create(null);

        this.id = uuidv4();
        this.timeout = 60 * 60 * 1000; // 1 hour.

        if (options) {
            if (String.isString(options.id)
                && !String.isEmptyOrWhitespace(options.id)) {
                this.id = options.id;
            }

            if (Number.isInteger(options.timeout)) {
                this.timeout = options.timeout;
            }
        }

        this.channelProxy = channelProxy;
        this.channelProxy.setDataHandler(this.onMessageAsync);
    }

    public map(pattern: IRoutePattern, asyncHandler: AsyncRequestHandler): void {
        this.validateDisposal();

        if (!pattern) {
            throw new Error("pattern must be provided.");
        }

        if (!Function.isFunction(asyncHandler)) {
            throw new Error("asyncHandler must be a function.");
        }

        const route: IRoute = {
            pattern: pattern,
            asyncHandler: asyncHandler
        };

        this.routes.push(route);
    }

    public unmap(pattern: IRoutePattern): AsyncRequestHandler {
        this.validateDisposal();

        if (utils.isNullOrUndefined(pattern)) {
            throw new Error("pattern must be supplied.");
        }

        const routeIndex = this.routes.findIndex((route) => route.pattern.equals(pattern));

        if (routeIndex < 0) {
            return undefined;
        }

        const asyncHandler = this.routes[routeIndex].asyncHandler;

        this.routes.splice(routeIndex, 1);

        return asyncHandler;
    }

    public sendAsync<TRequest, TResponse>(path: string, content: TRequest): Promise<TResponse> {
        this.validateDisposal();

        if (String.isEmptyOrWhitespace(path)) {
            throw new Error("path must be a string and not empty/whitespaces.");
        }

        return new Promise((resolve, reject) => {
            const msg: IMessage = {
                id: uuidv4(),
                path: path,
                body: content
            };

            if (!this.channelProxy.sendMessage(msg)) {
                reject(new Error("Failed to send request. The remote channel may be closed."));
                return;
            }

            const timer =
                setTimeout(
                    (reject) => {
                        delete this.ongoingPromiseDict[msg.id];
                        reject(new Error(utils.format("Response for the ipc message timed out: {}", msg)));
                    },
                    this.timeout,
                    reject);

            this.ongoingPromiseDict[msg.id] = {
                resolve:
                    (result) => {
                        clearTimeout(timer);
                        resolve(result);
                    },
                reject:
                    (error) => {
                        clearTimeout(timer);
                        reject(error);
                    }
            };
        });
    }

    public get disposed(): boolean {
        return this.channelProxy === undefined;
    }

    public async disposeAsync(): Promise<void> {
        if (this.disposed) {
            return;
        }

        await this.channelProxy.disposeAsync();
        Object.values(this.ongoingPromiseDict).forEach((resolver) => resolver.reject(new Error(`Communicator (${this.id}) is disposed.`)));

        this.channelProxy.setDataHandler(undefined);
        this.channelProxy = undefined;
        this.routes = undefined;
        this.ongoingPromiseDict = undefined;
    }

    private validateDisposal(): void {
        if (this.disposed) {
            throw new Error(`Communicator (${this.id}) already disposed.`);
        }
    }

    private onMessageAsync = async (channel: ChannelType, msg: IMessage): Promise<void> => {
        const promise = this.ongoingPromiseDict[msg.id];

        if (promise) {
            delete this.ongoingPromiseDict[msg.id];
            msg.succeeded ? promise.resolve(msg.body) : promise.reject(msg.body);

        } else if (utils.isNullOrUndefined(msg.succeeded)) {
            const route = this.routes.find((route) => route.pattern.match(msg.path));

            if (route !== undefined) {
                let response: any;
                let succeeded: boolean;

                try {
                    response = await route.asyncHandler(this, msg.path, msg.body);
                    succeeded = true;
                } catch (exception) {
                    response = exception;
                    succeeded = false;
                }

                if (!this.channelProxy.sendMessage({
                    id: msg.id,
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
