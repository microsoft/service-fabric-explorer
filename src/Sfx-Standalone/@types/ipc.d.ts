//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

export interface ISender {
    readonly id: string;

    send<TResult>(eventName: string, ...args: Array<any>): void;
    sendSync?<TResult>(eventName: string, ...args: Array<any>): TResult;
}

export interface ICommunicator extends IDisposable, ISender {
    readonly isHost: boolean;

    on(eventName: string, handler: (responser: ISender, ...args: Array<any>) => any): void;
    once(eventName: string, handler: (responser: ISender, ...args: Array<any>) => any): void;
    removeListener(eventName: string, handler: Function): void;
}

export interface IProxy extends IDisposable {
    readonly id: string;

    on(eventName: "resolve-object", handler: (objectIdentity: string, ...args: Array<any>) => object): void;
    on(eventName: "proxy-connected", handler: (responser: ISender) => void): void;
    on(eventName: "proxy-disconnected", handler: (responser: ISender) => void): void;
    removeListener(eventName: string, handler: Function): void;

    requestObject<T extends object>(objectIdentity: string, ...args: Array<any>): T;
    requestObjectFromProxy<T extends Object>(proxyId: string, objectIdentity: string, ...args: Array<any>): T;
    releaseObject(proxyObject: object): void;
}

declare global {
    interface IModuleManager {
        getComponent(componentIdentity: "ipc-communicator-electron",
            webContentId?: number,
            channelName?: string): ICommunicator;

        getComponent(componentIdentity: "ipc-proxy-electron",
            communicator: ICommunicator,
            autoclose?: boolean): IProxy;
    }
}
