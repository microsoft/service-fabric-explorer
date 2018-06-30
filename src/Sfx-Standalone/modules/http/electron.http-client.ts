//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IHttpClient, IRequestOptions } from "sfx.http";

import { ClientRequest } from "electron";

export class HttpClient implements IHttpClient {
    private requestOptions: IRequestOptions;

    public get defaultRequestOptions(): IRequestOptions {
        return this.requestOptions;
    }

    constructor() {

    }

    public updateDefaultRequestOptions(options: IRequestOptions): void {
        throw new Error("Method not implemented.");
    }

    public deleteAsync(url: string): Promise<any> {
        throw new Error("Method not implemented.");
    }

    public getAsync(url: string): Promise<any> {
        throw new Error("Method not implemented.");
    }

    public patchAsync(url: string, data: any): Promise<any> {
        throw new Error("Method not implemented.");
    }

    public postAsync(url: string, data: any): Promise<any> {
        throw new Error("Method not implemented.");
    }

    public putAsync(url: string, data: any): Promise<any> {
        throw new Error("Method not implemented.");
    }

    public requestAsync(requestOptions: import("sfx.http").IRequestOptions, data: any): Promise<any> {
        throw new Error("Method not implemented.");
    }
}
