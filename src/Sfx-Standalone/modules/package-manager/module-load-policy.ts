//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { ISettings } from "sfx.settings";
import { IModuleLoadingPolicy, IModuleManager, IModuleInfo } from "sfx.module-manager";

import { IPackageManagerConfig, PackageManagerSettingsName } from "./common";

export default class ModuleLoadingPolicy implements IModuleLoadingPolicy {
    private readonly settings: ISettings;

    constructor(settings: ISettings) {
        this.settings = settings;
    }

    public async shouldLoadAsync(moduleManager: IModuleManager, nameOrInfo: string | IModuleInfo): Promise<boolean> {
        if (!String.isString(nameOrInfo)) {
            return true;
        }

        const config = await this.settings.getAsync<IPackageManagerConfig>(PackageManagerSettingsName);
        const packageConfig = config.packages[nameOrInfo];

        if (!packageConfig) {
            config.packages[nameOrInfo] = {
                enabled: true
            };

            this.settings.setAsync(PackageManagerSettingsName, config);

            return true;
        }

        if (packageConfig.enabled === false) {
            return false;
        }

        return true;
    }
}
