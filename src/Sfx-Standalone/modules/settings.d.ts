//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
declare module "sfx.settings" {
    export interface ISettings {
        readonly readonly: boolean;

        get<T>(settingPath: string): T;

        set<T>(settingPath: string, value: T): void;
    }

    export interface ISettingsService {
        readonly default: ISettings;

        open(...names: Array<string>): ISettings;
    }
}

declare module "sfx.module-manager" {
    import { ISettingsService, ISettings } from "sfx.settings";

    export interface IModuleManager {
        getComponentAsync(componentIdentity: "settings.service"): Promise<ISettingsService>;
        getComponentAsync(componentIdentity: "settings"): Promise<ISettings>;
    }
}
