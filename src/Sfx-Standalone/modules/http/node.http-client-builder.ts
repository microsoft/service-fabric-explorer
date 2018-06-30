//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import {
    IHttpClientBuilder,
    ResponseAsyncHandler,
    RequestAsyncProcessor,
    IHttpClient
} from "sfx.http";

import { ILog } from "sfx.logging";
import { ICertificateLoader } from "sfx.cert";
import { IHandlerChainBuilder, IHandlerConstructor } from "sfx.common";

import { HandlerChainBuilder } from "../../utilities/handlerChainBuilder";
import { HttpClient } from "./node.http-client";

export class HttpClientBuilder implements IHttpClientBuilder {
    private readonly log: ILog;
    private readonly certLoader: ICertificateLoader;
    private readonly requestHandlerBuilder: IHandlerChainBuilder<RequestAsyncProcessor>;
    private readonly responseHandlerBuilder: IHandlerChainBuilder<ResponseAsyncHandler>;

    constructor(log: ILog, certLoader: ICertificateLoader) {
        this.log = log;
        this.certLoader = certLoader;
        this.requestHandlerBuilder = new HandlerChainBuilder<RequestAsyncProcessor>();
        this.responseHandlerBuilder = new HandlerChainBuilder<ResponseAsyncHandler>();
    }

    public handleRequest(constructor: IHandlerConstructor<RequestAsyncProcessor>): IHttpClientBuilder {
        this.requestHandlerBuilder.handle(constructor);

        return this;
    }

    public handleResponse(constructor: IHandlerConstructor<ResponseAsyncHandler>): IHttpClientBuilder {
        this.responseHandlerBuilder.handle(constructor);

        return this;
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