//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export declare namespace Standalone.http {
        type HttpMethod =
            "GET" | "POST" | "PUT" | "PATCH" | "DELETE" |
            "HEAD" | "CONNECT" | "OPTIONS" | "TRACE";

        interface IHttpHeader {
            name: string;
            value: string;
        }

        interface IHttpResponse {
            httpVersion: string;
            statusCode: number;
            statusMessage: string;

            data: any;

            headers: Array<IHttpHeader>;
            body: Array<number>;
        }

        interface IHttpRequest {
            method: HttpMethod;
            url: string;
            headers?: Array<IHttpHeader>;
            body?: any;
        }

        interface IHttpClient {
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
    }

    declare const sfxModuleManager: {
        getComponentAsync<T>(componentIdentity: string, ...extraArgs: Array<any>): Promise<T>;
    };

    export class StandaloneIntegration {
        private static require: (moduleName: string) => any = window["nodeRequire"];

        private static _clusterUrl: string = null;

        public static isStandalone(): boolean {
            return typeof sfxModuleManager !== "undefined" && sfxModuleManager !== null;
        }

        public static get clusterUrl(): string {

            if (this._clusterUrl == null) {
                if (typeof this.require === "function") {
                    this._clusterUrl = this.require("electron").remote.getGlobal("TargetClusterUrl");
                } else {
                    this._clusterUrl = "";
                }
            }

            return StandaloneIntegration._clusterUrl;
        }

        public static getHttpClient(): Promise<Standalone.http.IHttpClient> {
            if (this.isStandalone()) {
                return sfxModuleManager.getComponentAsync("http.http-client.service-fabric");
            }

            return undefined;
        }
    }
}
