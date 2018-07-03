//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IHttpClient } from "sfx.http";
import { ILog } from "sfx.logging";
import { ICertificateLoader } from "sfx.cert";

import HttpClient from "./node.http-client";
import HttpClientBuilderBase from "./http-client-builder-base";

export default class HttpClientBuilder extends HttpClientBuilderBase {
    private readonly certLoader: ICertificateLoader;

    constructor(log: ILog, certLoader: ICertificateLoader) {
        super(log);
        this.certLoader = certLoader;
    }

    public build(protocol: string): IHttpClient {
        return new HttpClient(
            this.log,
            this.certLoader,
            protocol,
            this.requestHandlerBuilder.build(),
            this.responseHandlerBuilder.build());
    }
}
