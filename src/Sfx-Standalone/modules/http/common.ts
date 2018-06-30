//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

export enum SslProtocols {
    tls = "TLS",
    tls12 = "TLS1.2",
    tls11 = "TLS1.1",
    tls10 = "TLS1.0",
    ssl30 = "SSL3.0"
}

export enum HttpProtocols {
    any = "*",
    http = "http:",
    https = "https:"
}

export enum HttpMethods {
    get = "GET",
    post = "POST",
    put = "PUT",
    patch = "PATCH",
    delete = "DELETE"
}

export enum HttpContentTypes {
    json = "application/json",
    binary = "application/octet-stream"
}