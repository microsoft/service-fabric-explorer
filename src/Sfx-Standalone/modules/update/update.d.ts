//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "sfx.update" {
    import { IVersionInfo } from "sfx.common";

    export interface IUpdateService {
        updateAsync(): Promise<void>;

        requestVersionInfoAsync(): Promise<IVersionInfo>;
    }
}

declare module "sfx.module-manager" {
    import { IUpdateService } from "sfx.update";

    export interface IModuleManager {
        getComponentAsync(componentIdentity: "update"): Promise<IUpdateService>;
    }
}
