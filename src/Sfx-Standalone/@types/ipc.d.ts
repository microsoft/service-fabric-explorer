//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

interface RequestHandler {
    (path: string, content: any): any;
}

interface ICommunicator extends IDisposable {
    readonly id: string;

    getRequestHandler(): RequestHandler;
    setRequestHandler(handler: RequestHandler): void;

    sendAsync<TRequest, TResponse>(path: string, content: TRequest): Promise<TResponse>;
}

interface ObjectResolver {
    (objectName: string, ...extraArgs: Array<any>): Object;
}

interface IProxy extends IDisposable {
    readonly id: string;

    requestObjectByNameAsync<T>(name: string, ...extraArgs: Array<any>): Promise<T>;
    requestObjectByIdAsync<T>(id: string): Promise<T>;

    setObjectResolver(resolver: ObjectResolver): void;
    getObjectResolver(): ObjectResolver;
}
