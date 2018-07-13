//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IHttpClient, ServerCertValidator } from "sfx.http";
import { ILog } from "sfx.logging";
import { ICertificateLoader } from "sfx.cert";

import HttpClient from "./node.http-client";
import HttpClientBuilderBase from "./http-client-builder-base";

export default class HttpClientBuilder extends HttpClientBuilderBase {
    private readonly certLoader: ICertificateLoader;

    private readonly serverCertValidator: ServerCertValidator;

    constructor(
        log: ILog, 
        certLoader: ICertificateLoader, 
        serverCertValidator?: ServerCertValidator) {

        super(log);

        this.certLoader = certLoader;
        this.serverCertValidator = serverCertValidator;
    }

    public build(protocol: string): IHttpClient {
        return new HttpClient(
            this.log,
            this.certLoader,
            protocol,
            this.serverCertValidator,
            this.requestHandlerBuilder.build(),
            this.responseHandlerBuilder.build());
    }
}
