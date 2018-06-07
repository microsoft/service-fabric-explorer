//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
declare module "sfx.update-svc" {
    import { IVersionInfo } from "sfx";

    export interface IUpdateService {
        update(): void;

        requestVersionInfo(callback: (error, versionInfo: IVersionInfo) => void): void;
    }
}

declare module "sfx" {
    import { IUpdateService } from "sfx.update-svc";

    export interface IModuleManager {
        getComponentAsync(componentIdentity: "update-service"): Promise<IUpdateService>;
    }
}
