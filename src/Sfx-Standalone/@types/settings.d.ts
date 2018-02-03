//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

export interface ISettings {
    readonly readonly: boolean;

    get<T>(settingPath: string): T;

    set<T>(settingPath: string, value: T): void;
}

export interface ISettingsService {
    readonly default: ISettings;

    open(...names: Array<string>): ISettings;
}

declare global {
    interface IModuleManager {
        getComponent(componentIdentity: "settings-service"): ISettingsService;
        getComponent(componentIdentity: "settings"): ISettings;
    }
}
