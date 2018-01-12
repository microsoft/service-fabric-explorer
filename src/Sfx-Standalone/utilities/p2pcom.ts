//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { remote, ipcRenderer } from "electron";
import * as util from "util";

import electron from "./electronAdapter";
import error from "./errorUtil";

interface IEventEmmiter {
    send(channel: string, ...args: any[]): void;
}

interface IEventListener {
    on(channel: string, listener: Function): this;
}

function formPromptIdentifier(windowId: number): string {
    return "prompt-" + windowId;
}

function getPromptIdentifier(): string {
    return formPromptIdentifier(remote.getCurrentWindow().id);
}

function getP2pComEventName(wndId: number = undefined, name: string = undefined, category: string = undefined): string {
    if (!util.isNumber(wndId) || isNaN(wndId)) {
        wndId = remote.getCurrentWindow().id;
    }

    let eventName: string = "p2pcom-" + wndId;

    if (util.isString(category)) {
        eventName += "-" + category;
    }

    if (util.isString(name)) {
        eventName += "-" + name;
    }

    return eventName; // "p2pcom-{wndId}-{category}-{name}"
}

export class Communicator {
    private readonly wndId: number;

    private readonly channelName: string;

    private readonly eventEmmiter: IEventEmmiter;

    private readonly eventListener: IEventListener;

    constructor(channelName: string);
    constructor(channelName: string, wndId: number);
    constructor(channelName: string, wndId: number = undefined) {
        if (!util.isNumber(wndId) || isNaN(wndId)) {

            if (util.isNullOrUndefined(remote)) {
                throw error("wndId must be supplied in the main process.");
            }

            // For child process.
            this.wndId = remote.getCurrentWindow().id;
            this.eventEmmiter = ipcRenderer;
            this.eventListener = ipcRenderer;
        } else {
            // For main process.
            this.wndId = wndId;

            let window = electron.BrowserWindow.fromId(this.wndId);

            if (!window) {
                throw error("The wndId supplied is not associated with any browswer window.");
            }

            this.eventEmmiter = window.webContents;
            this.eventListener = electron.ipcMain;
        }

        if (!util.isString(channelName)) {
            throw error("channelName must be supplied.");
        }

        this.channelName = channelName;
    }

    public handle<T>(eventName: string, callback: (args: T) => void): void {
        if (!util.isFunction(callback)) {
            throw error("callback arg must be a function.");
        }

        this.eventListener.on(getP2pComEventName(this.wndId, eventName, this.channelName), (event, args) => callback(args));
    }

    public emit<T>(eventName: string, args: any = undefined): void {
        this.eventEmmiter.send(getP2pComEventName(this.wndId, eventName, this.channelName), args);
    }
}

export function prepareData(wndId: number, data: any): void {
    if (!util.isNumber(wndId)) {
        throw error("wndId must be specified.");
    }

    electron.ipcMain.once(getP2pComEventName(wndId), (event, args) => event.returnValue = data);
}

export function requestData<T>(): T {
    if (util.isNullOrUndefined(remote)) {
        throw error("Cannot request data from the main process.");
    }

    return ipcRenderer.sendSync(getP2pComEventName());
}
