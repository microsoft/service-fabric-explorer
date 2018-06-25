//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IDictionary, IDisposable } from "sfx.common";
import { RequestHandler, ICommunicator, IRoutePattern } from "sfx.remoting";
import { ChannelType } from "sfx.ipc";

import { ChildProcess } from "child_process";
import { Socket } from "net";
import * as uuidv4 from "uuid/v4";
import * as uuidv5 from "uuid/v5";
import * as electron from "electron";

import * as utils from "../../utilities/utils";

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

interface IRoute {
    pattern: IRoutePattern;
    handler: RequestHandler;
}

interface ChannelProxyDataHandler {
    (data: any): void | Promise<void>;
}

interface IChannelProxy extends IDisposable {
    dispose(): void;
    sendMessage(msg: IMessage): boolean;
}

const UuidNamespace = "65ef6f94-e6c9-4c95-8360-6d29de87b1dd";

class ProcessChannelProxy implements IChannelProxy {
    private channel: ChildProcess;

    private dataHandler: ChannelProxyDataHandler;

    public get disposed(): boolean {
        return this.channel === undefined;
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
    public static isValidChannel(channel: any): channel is ChildProcess {
        return !utils.isNullOrUndefined(channel)
            && Function.isFunction(channel.kill)
            && Number.isNumber(channel.pid)
            && Function.isFunction(channel.send)
            && Function.isFunction(channel.on)
            && Function.isFunction(channel.removeListener);
    }

    public dispose(): void {
        if (!this.disposed) {
            this.channel.removeListener("message", this.dataHandler);
            this.channel = undefined;
            this.dataHandler = undefined;
        }
    }

    public sendMessage(msg: IMessage): boolean {
        if (this.disposed) {
            throw new Error("Channel proxy already disposed.");
        }

        return this.channel.send(msg);
    }

    constructor(channel: ChildProcess, dataHandler: ChannelProxyDataHandler) {
        this.channel = channel;
        this.dataHandler = dataHandler;
        this.channel.on("message", this.dataHandler);
    }
}

class ElectronWebContentsChannelProxy implements IChannelProxy {
    private readonly channelName: string;

    private channel: electron.WebContents;

    private dataHandler: ChannelProxyDataHandler;

    public get disposed(): boolean {
        return this.channel === undefined;
    }

    public static isValidChannel(channel: any): channel is electron.WebContents {
        return !utils.isNullOrUndefined(channel)
            && !utils.isNullOrUndefined(electron.ipcMain)
            && Function.isFunction(channel.executeJavaScript)
            && Function.isFunction(channel.setAudioMuted)
            && Function.isFunction(channel.setZoomFactor)
            && Function.isFunction(channel.findInPage)
            && Function.isFunction(channel.send);
    }

    public dispose(): void {
        if (!this.disposed) {
            electron.ipcMain.removeListener(this.channelName, this.onChannelData);

            this.channel = undefined;
            this.dataHandler = undefined;
        }
    }

    public sendMessage(msg: IMessage): boolean {
        if (this.disposed) {
            throw new Error("Channel proxy already disposed.");
        }

        this.channel.send(this.channelName, msg);
        return true;
    }

    constructor(channel: electron.WebContents, dataHandler: ChannelProxyDataHandler) {
        this.channel = channel;
        this.dataHandler = dataHandler;
        this.channelName = uuidv5(channel.id.toString(), UuidNamespace);

        electron.ipcMain.on(this.channelName, this.onChannelData);
    }

    private onChannelData = (event: electron.Event, data: any): void => {
        this.dataHandler(data);
    }
}

class ElectronIpcRendererChannelProxy implements IChannelProxy {
    private readonly channelName: string;

    private channel: electron.IpcRenderer;

    private dataHandler: ChannelProxyDataHandler;

    public get disposed(): boolean {
        return this.channel === undefined;
    }

    public static isValidChannel(channel: any): channel is electron.IpcRenderer {
        return !utils.isNullOrUndefined(channel)
            && !utils.isNullOrUndefined(electron.remote)
            && Function.isFunction(channel.sendSync)
            && Function.isFunction(channel.sendTo)
            && Function.isFunction(channel.sendToHost)
            && Function.isFunction(channel.send)
            && Function.isFunction(channel.on)
            && Function.isFunction(channel.removeListener);
    }

    public dispose(): void {
        if (!this.disposed) {
            this.channel.removeListener(this.channelName, this.onChannelData);

            this.channel = undefined;
            this.dataHandler = undefined;
        }
    }

    public sendMessage(msg: IMessage): boolean {
        if (this.disposed) {
            throw new Error("Channel proxy already disposed.");
        }

        this.channel.send(this.channelName, msg);
        return true;
    }

    constructor(channel: electron.IpcRenderer, dataHandler: ChannelProxyDataHandler) {
        this.channel = channel;
        this.dataHandler = dataHandler;
        this.channelName = uuidv5(electron.remote.getCurrentWebContents().id.toString(), UuidNamespace);
        
        this.channel.on(this.channelName, this.onChannelData);
    }

    private onChannelData = (event: electron.Event, data: any) => {
        this.dataHandler(data);
    }
}

class SocketChannelProxy implements IChannelProxy {
    private channel: Socket;

    private dataHandler: ChannelProxyDataHandler;

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

    constructor(channel: Socket, dataHandler: ChannelProxyDataHandler) {
        this.channel = channel;
        this.dataHandler = dataHandler;

        this.channel.on("data", this.dataHandler);
    }

    private onChannelData = (data: Buffer) => {
        if (String.isString(data)) {
            try {
                this.dataHandler(JSON.parse(data));
            } catch { }
        }
    }
}

function generateChannelProxy(channel: any, dataHandler: ChannelProxyDataHandler): IChannelProxy {
    if (utils.isNullOrUndefined(channel)) {
        throw new Error("channel must be supplied.");
    } else if (ProcessChannelProxy.isValidChannel(channel)) {
        return new ProcessChannelProxy(channel, dataHandler);

    } else if (ElectronWebContentsChannelProxy.isValidChannel(channel)) {
        return new ElectronWebContentsChannelProxy(channel, dataHandler);

    } else if (ElectronIpcRendererChannelProxy.isValidChannel(channel)) {
        return new ElectronIpcRendererChannelProxy(channel, dataHandler);

    } else if (SocketChannelProxy.isValidChannel(channel)) {
        return new SocketChannelProxy(channel, dataHandler);

    } else {
        throw new Error("Unknown channel type. Only supports NodeJS.Process, NodeJS.ChildProcess, NodeJS.Socket, Electron.IpcRenderer, Electron.WebContents.");
    }
}

export class Communicator implements ICommunicator {
    public readonly id: string;

    private ongoingPromiseDict: IDictionary<IPromiseResolver>;

    private routes: Array<IRoute>;

    private channelProxy: IChannelProxy;

    constructor(
        channel: ChannelType,
        id?: string) {
        this.routes = [];
        this.ongoingPromiseDict = Object.create(null);
        this.id = String.isString(id) && !String.isEmptyOrWhitespace(id) ? id : uuidv4();
        this.channelProxy = generateChannelProxy(channel, this.onMessageAsync);
    }

    public map(pattern: IRoutePattern, handler: RequestHandler): void {
        this.validateDisposal();

        if (!pattern) {
            throw new Error("pattern must be provided.");
        }

        if (!Function.isFunction(handler)) {
            throw new Error("handler must be a function.");
        }

        const route: IRoute = {
            pattern: pattern,
            handler: handler
        };

        this.routes.push(route);
    }

    public unmap(pattern: IRoutePattern): RequestHandler {
        this.validateDisposal();

        if (utils.isNullOrUndefined(pattern)) {
            throw new Error("pattern must be supplied.");
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

        if (String.isEmptyOrWhitespace(path)) {
            throw new Error("path must be a string and not empty/whitespaces.");
        }

        return new Promise((resolve, reject) => {
            const msg: IMessage = {
                id: uuidv4(),
                path: path,
                succeeded: true,
                body: content
            };

            if (!this.channelProxy.sendMessage(msg)) {
                reject(new Error("Failed to send request. The remote channel may be closed."));
                return;
            }

            this.ongoingPromiseDict[msg.id] = {
                resolve: resolve,
                reject: reject
            };
        });
    }

    public get disposed(): boolean {
        return this.channelProxy === undefined;
    }

    public dispose(): void {
        if (this.disposed) {
            return;
        }

        this.channelProxy.dispose();
        Object.values(this.ongoingPromiseDict).forEach((resolver) => resolver.reject(new Error(`Communicator (${this.id}) is disposed.`)));

        this.channelProxy = undefined;
        this.routes = undefined;
        this.ongoingPromiseDict = undefined;
    }

    private validateDisposal(): void {
        if (this.disposed) {
            throw new Error(`Communicator (${this.id}) already disposed.`);
        }
    }

    private onMessageAsync = async (msg: IMessage): Promise<void> => {
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
