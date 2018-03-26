//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

interface RequestHandler {
    (communicator: ICommunicator, path: string, content: any): any;
}

interface ICommunicator extends IDisposable {
    readonly id: string;

    map(pattern: string | RegExp, handler: RequestHandler): void;
    unmap(pattern: string | RegExp): RequestHandler;

    sendAsync<TRequest, TResponse>(path: string, content: TRequest): Promise<TResponse>;
}

interface ObjectResolver {
    (objectName: string, ...extraArgs: Array<any>): Object;
}

interface IProxy extends IDisposable {
    readonly id: string;

    requestObjectByNameAsync<T>(name: string, ...extraArgs: Array<any>): Promise<T>;
    requestObjectByIdAsync<T>(id: string): Promise<T>;
    releaseObject(id: string): void;

    addObject(obj: Object): string;
    removeObject(obj: Object): void;
    removeObjectById(objId: string): Object;

    setObjectResolver(resolver: ObjectResolver): void;
    getObjectResolver(): ObjectResolver;
}
