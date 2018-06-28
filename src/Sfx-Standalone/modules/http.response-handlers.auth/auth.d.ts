//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

/// <reference path="./cert/cert.d.ts" />

declare module "sfx.module-manager" {
    import { IHandlerConstructor } from "sfx.common";
    import { ResponseAsyncHandler } from "sfx.http";

    export interface IModuleManager {
        getComponentAsync(componentIdentity: "http.response-handlers.auth.handle-cert"): Promise<IHandlerConstructor<ResponseAsyncHandler>>;
        getComponentAsync(componentIdentity: "http.response-handlers.auth.handle-aad"): Promise<IHandlerConstructor<ResponseAsyncHandler>>;
    }
}
