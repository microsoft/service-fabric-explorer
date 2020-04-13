//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------


type HttpMethod =
    "GET" | "POST" | "PUT" | "PATCH" | "DELETE" |
    "HEAD" | "CONNECT" | "OPTIONS" | "TRACE";

interface IHttpHeader {
    name: string;
    value: string;
}

export interface IHttpResponse {
    httpVersion: string;
    statusCode: number;
    statusMessage: string;

    data: any;

    headers: Array<IHttpHeader>;
    body: Array<number>;
}

export interface IHttpRequest {
    method: HttpMethod;
    url: string;
    headers?: Array<IHttpHeader>;
    body?: any;
}

export interface IHttpClient {
    getRequestTemplateAsync(): Promise<IHttpRequest>;

    setRequestTemplateAsync(template: IHttpRequest): Promise<void>;

    getAsync<T>(url: string): Promise<T>;

    postAsync<T>(url: string, data: any): Promise<T>;

    putAsync<T>(url: string, data: any): Promise<T>;

    patchAsync<T>(url: string, data: any): Promise<T>;

    deleteAsync<T>(url: string): Promise<T>;

    headAsync<T>(url: string): Promise<T>;

    optionsAsync<T>(url: string, data: any): Promise<T>;

    traceAsync<T>(url: string, data: any): Promise<T>;

    requestAsync(request: IHttpRequest): Promise<IHttpResponse>;
}


declare const sfxModuleManager: {
    getComponentAsync<T>(componentIdentity: string, ...extraArgs: Array<any>): Promise<T>;
};

export class StandaloneIntegration {
    private static _clusterUrl: string = null;

    public static isStandalone(): boolean {
        return typeof sfxModuleManager !== "undefined" && sfxModuleManager !== null;
    }

    public static get clusterUrl(): string {
        if (StandaloneIntegration._clusterUrl == null) {
            if (StandaloneIntegration.isStandalone()) {
                StandaloneIntegration._clusterUrl = StandaloneIntegration.extractQueryItem(window.location.search, "targetcluster");
            } else {
                StandaloneIntegration._clusterUrl = "";
            }
        }

        return StandaloneIntegration._clusterUrl;
    }

    public static getHttpClient(): Promise<IHttpClient> {
        if (this.isStandalone()) {
            return sfxModuleManager.getComponentAsync<IHttpClient>("http.http-client.service-fabric");
        }

        return undefined;
    }

    private static extractQueryItem(queryString: string, name: string): string {
        if (queryString) {
            let urlParameters = window.location.search.split("?")[1];
            let queryParams = urlParameters.split("&");
            for (let i = 0; i < queryParams.length; i++) {
                let queryParam = queryParams[i].split("=");
                if (queryParam[0] === name) {
                    return decodeURIComponent(queryParam[1]);
                }
            }
        }

        return null;
    }
}

