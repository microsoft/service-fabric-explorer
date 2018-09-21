//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "sfx.http-next" {
    import { IDictionary } from "sfx.common";

    export type HttpMethod =
        "GET" | "POST" | "PUT" | "PATCH" | "DELETE" |
        "HEAD" | "CONNECT" | "OPTIONS" | "TRACE";

    export interface IHttpHeader {
        name: string;
        value: string;
    }

    export interface IHttpResponse<T> {
        statusCode: number;
        statusMessage: string;

        result: T;

        headers: Array<IHttpHeader>;
        body: Buffer;
    }

    export interface IHttpRequest {
        method: HttpMethod;
        url: string;
        headers?: Array<IHttpHeader>;
        body?: any;
    }

    export type HttpRequestHandler = () => void;
}
