//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { ISettingsService } from "sfx.settings";
import * as shell from "donuts.node/shell";
import * as settings from "donuts.node-settings";

class SettingsService implements ISettingsService {
    async openAsync(...names: string[]): Promise<Donuts.Settings.ISettings> {
        return settings.openSettingsAsChain(...names);
    }
}

(<Donuts.Modularity.IModule>exports).getModuleMetadata = (components): Donuts.Modularity.IModuleInfo => {
    components
        .register<Donuts.Settings.ISettings>({
            name: "default",
            version: shell.getAppVersion(),
            descriptor: async () => settings.defaultSettings,
            singleton: true,
            deps: ["module-manager"]
        })
        .register<ISettingsService>({
            name: "service",
            version: shell.getAppVersion(),
            descriptor: async () => new SettingsService(),
            singleton: true
        });

    return {
        name: "settings",
        version: shell.getAppVersion()
    };
};
