//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "sfx.settings" {
    export interface ISettingsService {
        openAsync(...names: Array<string>): Promise<Donuts.Settings.ISettings>;
    }
}

declare module "sfx.module-manager" {
    import { ISettingsService } from "sfx.settings";

    export interface ISfxModuleManager {
        getComponentAsync(componentIdentity: "settings.service"): Promise<ISettingsService>;
        getComponentAsync(componentIdentity: "settings.default"): Promise<Donuts.Settings.ISettings>;
    }
}
