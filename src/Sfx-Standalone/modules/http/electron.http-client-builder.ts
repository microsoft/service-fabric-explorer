//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IHttpClient } from "sfx.http";
import { ILog } from "sfx.logging";

import HttpClient from "./electron.http-client";
import HttpClientBuilderBase from "./http-client-builder-base";

export default class HttpClientBuilder extends HttpClientBuilderBase {
    constructor(log: ILog) {
        super(log);
    }

    public build(protocol: string): IHttpClient {
        return new HttpClient(
            this.log,
            protocol,
            this.requestHandlerBuilder.build(),
            this.responseHandlerBuilder.build());
    }
}
