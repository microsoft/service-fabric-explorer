//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IHttpClient, IHttpResponse, HttpRequestHandler, HttpResponseHandler } from "sfx.http";
import HttpPipeline from "./http-pipeline";

import createNodeRequestHandler from "./request-handlers/node";

import createRedirectionResponseHandler from "./response-handlers/redirection";
import createJsonResponseHandler from "./response-handlers/json";

export default class HttpClient extends HttpPipeline implements IHttpClient {
    private static createHttpError(response: IHttpResponse): Error {
        const err = new Error(response.statusMessage);

        err["response"] = response;

        return err;
    }

    constructor(requestHandlers?: Array<HttpRequestHandler>, responseHandlers?: Array<HttpResponseHandler>) {
        super(
            requestHandlers ? requestHandlers : [createNodeRequestHandler()],
            responseHandlers ? responseHandlers : [createRedirectionResponseHandler(), createJsonResponseHandler()]);
    }

    public getAsync<T>(url: string): Promise<T> {
        return this.requestAsync(
            {
                method: "GET",
                url: url
            })
            .then((response) => response.result);
    }

    public postAsync<T>(url: string, data: any): Promise<T> {
        return this.requestAsync(
            {
                method: "POST",
                url: url,
                body: data
            })
            .then((response) => response.result);
    }

    public putAsync<T>(url: string, data: any): Promise<T> {
        return this.requestAsync(
            {
                method: "PUT",
                url: url,
                body: data
            })
            .then((response) => response.result);
    }

    public patchAsync<T>(url: string, data: any): Promise<T> {
        return this.requestAsync(
            {
                method: "PATCH",
                url: url,
                body: data
            })
            .then((response) => response.result);
    }

    public deleteAsync<T>(url: string): Promise<T> {
        return this.requestAsync(
            {
                method: "DELETE",
                url: url
            })
            .then((response) => response.result);
    }

    public headAsync<T>(url: string): Promise<T> {
        return this.requestAsync(
            {
                method: "HEAD",
                url: url
            })
            .then((response) => response.result);
    }

    public optionsAsync<T>(url: string, data: any): Promise<T> {
        return this.requestAsync(
            {
                method: "OPTIONS",
                url: url,
                body: data
            })
            .then((response) => response.result);
    }

    public traceAsync<T>(url: string, data: any): Promise<T> {
        return this.requestAsync(
            {
                method: "TRACE",
                url: url,
                body: data
            })
            .then((response) =>
                response.statusCode >= 300
                    ? Promise.reject(HttpClient.createHttpError(response))
                    : Promise.resolve(response.result));
    }
}
