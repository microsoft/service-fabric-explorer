// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------


type HttpMethod =
    'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' |
    'HEAD' | 'CONNECT' | 'OPTIONS' | 'TRACE';

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
    private static iclusterUrl: string = null;

    public static isStandalone(): boolean {
        return typeof sfxModuleManager !== 'undefined' && sfxModuleManager !== null;
    }

    public static get clusterUrl(): string {
        if (StandaloneIntegration.iclusterUrl == null) {
            if (StandaloneIntegration.isStandalone()) {
                StandaloneIntegration.iclusterUrl = StandaloneIntegration.extractQueryItem(window.location.search, 'targetcluster');
            } else {
                StandaloneIntegration.iclusterUrl = '';
            }
        }

        return StandaloneIntegration.iclusterUrl;
    }

    public static getHttpClient(): Promise<IHttpClient> {
        if (this.isStandalone()) {
            return sfxModuleManager.getComponentAsync<IHttpClient>("http.http-client.service-fabric");
        }

        return undefined;
    }

    private static extractQueryItem(queryString: string, name: string): string {
        if (queryString) {
            const urlParameters = window.location.search.split('?')[1];
            const queryParams = urlParameters.split('&');
            for (const q of queryParams) {
                const queryParam = q.split('=');
                if (queryParam[0] === name) {
                    return decodeURIComponent(queryParam[1]);
                }
            }
        }

        return null;
    }
}

