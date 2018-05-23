//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

interface RequestHandler {
    (communicator: ICommunicator, path: string, content: any): any | Promise<any>;
}

interface ICommunicator extends IDisposable {
    readonly id: string;

    map(pattern: string | RegExp, handler: RequestHandler): void;
    unmap(pattern: string | RegExp): RequestHandler;

    sendAsync<TRequest, TResponse>(path: string, content: TRequest): Promise<TResponse>;
}

interface IIpcUtilities {
    isCommunicator(communicator: any): communicator is ICommunicator;
}
