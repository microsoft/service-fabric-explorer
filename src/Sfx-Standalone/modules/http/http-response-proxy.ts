//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IDictionary } from "sfx.common";

import { Readable } from "stream";

export interface IUnderlyingHttpResponse extends Readable {
    httpVersion: string;
    statusCode: number;
    statusMessage: string;
    headers: IDictionary<string>;

    addListener(event: string, listener: (...args: any[]) => void): this;
    addListener(event: "aborted", listener: () => void): this;

    emit(event: string | symbol, ...args: any[]): boolean;
    emit(event: "aborted", listener: () => void): boolean;

    on(event: string, listener: (...args: any[]) => void): this;
    on(event: "aborted", listener: () => void): this;

    once(event: string, listener: (...args: any[]) => void): this;
    once(event: "aborted", listener: () => void): this;

    prependListener(event: string, listener: (...args: any[]) => void): this;
    prependListener(event: "aborted", listener: () => void): this;

    prependOnceListener(event: string, listener: (...args: any[]) => void): this;
    prependOnceListener(event: "aborted", listener: () => void): this;

    removeListener(event: string, listener: (...args: any[]) => void): this;
    removeListener(event: "aborted", listener: () => void): this;
}

export interface IHttpResponse {
    httpVersion: Promise<string>;
    statusCode: Promise<number>;
    statusMessage: Promise<string>;
    headers: Promise<IDictionary<string>>;

    
}

export class HttpResponseProxy implements IHttpResponse {

}
