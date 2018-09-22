//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import {
    IHttpResponse,
    IHttpClient
} from "sfx.http-next";

import { HttpPipeline } from "./http-pipeline";

export class HttpClient extends HttpPipeline implements IHttpClient {
    public deleteAsync(url: string): Promise<IHttpResponse> {
        return this.requestAsync({
            method: "DELETE",
            url: url
        });
    }

    public getAsync(url: string): Promise<IHttpResponse> {
        return this.requestAsync({
            method: "GET",
            url: url
        });
    }

    public patchAsync(url: string, data: any): Promise<IHttpResponse> {
        return this.requestAsync({
            method: "PATCH",
            url: url,
            body: data
        });
    }

    public postAsync(url: string, data: any): Promise<IHttpResponse> {
        return this.requestAsync({
            method: "POST",
            url: url,
            body: data
        });
    }

    public putAsync(url: string, data: any): Promise<IHttpResponse> {
        return this.requestAsync({
            method: "PUT",
            url: url,
            body: data
        });
    }
}
