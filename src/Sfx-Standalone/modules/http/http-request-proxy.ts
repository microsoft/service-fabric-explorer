//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IHttpResponse } from "./http-response-proxy";

import { Writable } from "stream";

export interface IUnderlyingHttpRequest extends Writable {
    getHeader(name: string): any;
    setHeader(name: string, value: any): void;
    removeHeader(name: string): void;
    abort(): void;

    addListener(event: string, listener: (...args: any[]) => void): this;
    addListener(event: "response", listener: (response: IHttpResponse) => void): this;
    addListener(event: "abort", listener: () => void): this;

    emit(event: string | symbol, ...args: any[]): boolean;
    emit(event: "response", listener: (response: IHttpResponse) => void): boolean;
    emit(event: "abort", listener: () => void): boolean;

    on(event: string, listener: (...args: any[]) => void): this;
    on(event: "response", listener: (response: IHttpResponse) => void): this;
    on(event: "abort", listener: () => void): this;

    once(event: string, listener: (...args: any[]) => void): this;
    once(event: "response", listener: (response: IHttpResponse) => void): this;
    once(event: "abort", listener: () => void): this;

    prependListener(event: string, listener: (...args: any[]) => void): this;
    prependListener(event: "response", listener: (response: IHttpResponse) => void): this;
    prependListener(event: "abort", listener: () => void): this;

    prependOnceListener(event: string, listener: (...args: any[]) => void): this;
    prependOnceListener(event: "response", listener: (response: IHttpResponse) => void): this;
    prependOnceListener(event: "abort", listener: () => void): this;

    removeListener(event: string, listener: (...args: any[]) => void): this;
    removeListener(event: "response", listener: (response: IHttpResponse) => void): this;
    removeListener(event: "abort", listener: () => void): this;
}

export interface IHttpRequest {
    getHeaderAsync(name: string): Promise<any>;
    setHeaderAsync(name: string, value: any): Promise<void>;
    removeHeaderAsync(name: string): Promise<void>;

    writeAsync(data: string | Buffer): Promise<void>;
    abortAsync(): Promise<void>;
    endAsync(): Promise<void>;
}

export class HttpRequestProxy implements IHttpRequest {
    private readonly httpRequest: IUnderlyingHttpRequest;

    constructor(underlyingHttpRequest: IUnderlyingHttpRequest) {
        if (!underlyingHttpRequest) {
            throw new Error("underlyingHttpRequest must be provided.");
        }

        this.httpRequest = underlyingHttpRequest;
    }

    public getHeaderAsync(name: string): Promise<any> {
        return Promise.resolve(this.httpRequest.getHeader(name));
    }

    public setHeaderAsync(name: string, value: any): Promise<void> {
        this.httpRequest.setHeader(name, value);

        return Promise.resolve();
    }

    public removeHeaderAsync(name: string): Promise<void> {
        this.httpRequest.removeHeader(name);

        return Promise.resolve();
    }

    public writeAsync(data: string | Buffer): Promise<void> {
        if (String.isString(data) || data instanceof Buffer) {
            return new Promise((resolve) =>
                this.httpRequest.write(data, undefined, () => resolve()));
        } else {
            throw new Error("data must be string or Buffer.");
        }
    }

    public abortAsync(): Promise<void> {
        this.httpRequest.abort();

        return Promise.resolve();
    }

    public endAsync(): Promise<void> {
        return new Promise((resolve) => this.httpRequest.end(undefined, undefined, () => resolve()));
    }
}
