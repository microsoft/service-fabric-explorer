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
import { IHandlerChainBuilder, IHandlerConstructor } from "sfx.common";

import { HandlerChainBuilder } from "../../utilities/handlerChainBuilder";

export default abstract class HttpClientBuilderBase implements IHttpClientBuilder {
    protected readonly log: ILog;
    protected readonly requestHandlerBuilder: IHandlerChainBuilder<RequestAsyncProcessor>;
    protected readonly responseHandlerBuilder: IHandlerChainBuilder<ResponseAsyncHandler>;

    constructor(log: ILog) {
        this.log = log;
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

    public abstract build(protocol: string): IHttpClient;
}
