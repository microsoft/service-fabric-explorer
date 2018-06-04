//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
declare module "sfx.update-svc" {
    import * as common from "sfx";

    export interface IUpdateService {
    update(): void;

    requestVersionInfo(callback: (error, versionInfo: common.IVersionInfo) => void): void;
}
}

declare module "sfx" {
    import * as update from "sfx.update-svc";

    export interface IModuleManager {
        getComponent(componentIdentity: "update-service"): update.IUpdateService;
    }
}
