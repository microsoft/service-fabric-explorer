//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IDictionary } from "sfx.common";
import { IHttpResponse } from "sfx.http";

import { Readable } from "stream";

export interface IUnderlyingHttpResponse extends Readable {
    httpVersion: string;
    statusCode: number;
    statusMessage: string;
    headers: IDictionary<string>;
}

export class HttpResponseProxy implements IHttpResponse {
    private readonly _httpResponse: IUnderlyingHttpResponse;

    public get httpResponse(): IUnderlyingHttpResponse {
        return this._httpResponse;
    }

    public get httpVersion(): Promise<string> {
        return Promise.resolve(this.httpResponse.httpVersion);
    }

    public get statusCode(): Promise<number> {
        return Promise.resolve(this.statusCode);
    }

    public get statusMessage(): Promise<string> {
        return Promise.resolve(this.httpResponse.statusMessage);
    }

    public get headers(): Promise<IDictionary<string>> {
        return Promise.resolve(this.httpResponse.headers);
    }

    constructor(underlyinghttpResponse: IUnderlyingHttpResponse) {
        if (!underlyinghttpResponse) {
            throw new Error("underlyinghttpResponse must be provided.");
        }

        this._httpResponse = underlyinghttpResponse;
    }

    public async setEncodingAsync(encoding: string): Promise<void> {
        this.httpResponse.setEncoding(encoding);
    }

    public async readAsync(): Promise<string | Buffer> {
        return this.httpResponse.read();
    }
}
