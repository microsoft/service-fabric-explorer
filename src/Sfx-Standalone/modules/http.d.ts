//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "sfx.module-manager" {
    import { IHttpClient } from "sfx.http";

    export interface IModuleManager {
        getComponentAsync(componentIdentity: "http.http-client"): Promise<IHttpClient>;
        getComponentAsync(componentIdentity: "http.https-client"): Promise<IHttpClient>;
    }
}

declare module "sfx.http" {
    import { IDictionary } from "sfx.common";
    import { IncomingMessage } from "http";

    export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

    export interface IRequestOptions {
        method: HttpMethod;
        url: string;
        headers?: IDictionary<string | Array<string>>;
    }

    export interface IHttpClient {
        deleteAsync(url: string): Promise<IncomingMessage | any>;

        getAsync(url: string): Promise<IncomingMessage | any>;

        patchAsync(url: string, data: any): Promise<IncomingMessage | any>;

        postAsync(url: string, data: any): Promise<IncomingMessage | any>;

        putAsync(url: string, data: any): Promise<IncomingMessage | any>;

        requestAsync(requestOptions: IRequestOptions, data: any): Promise<IncomingMessage | any>;
    }
}
