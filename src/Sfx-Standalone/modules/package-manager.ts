//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { ISettings } from "sfx.settings";
import { IModuleManager, IModuleInfo } from "sfx.module-manager";
import {
    IPackageManager,
    IPackageRepository,
    IPackageRepositoryConfig,
    PackagePropertyName
} from "sfx.package-manager";

import { electron } from "../utilities/electron-adapter";
import * as utils from "../utilities/utils";

function isPackageRepositoryConfig(repoConfig: IPackageRepositoryConfig): boolean {
    return !utils.isNullOrUndefined(repoConfig)
        && String.isString(repoConfig.name)
        && String.isString(repoConfig.url);
}

class PackageRepository implements IPackageRepository {
    constructor(repoConfig: IPackageRepositoryConfig) {

    }
}

class PackageManagerSettings {
    private readonly settings: ISettings;
    private readonly sectionName: string;

    constructor(settings: ISettings, sectionName: string) {
        this.settings = settings;
        this.sectionName = sectionName;
    }

    public addRepo(repoConfig: IPackageRepositoryConfig): void {
        if (!isPackageRepositoryConfig(repoConfig)) {
            throw new Error("repoConfig must be provided and implements IPackageRepositoryConfig.");
        }

        this.settings.set(this.generatePath("repos", repoConfig.name), repoConfig);
    }

    public getRepoConfigs(): Array<IPackageRepositoryConfig> {
        const reposConfig = this.settings.get(this.generatePath("repos"));

        return Object.values(reposConfig);
    }

    public removeRepo(repoName: string): void {
        if (!String.isString(repoName)) {
            return;
        }

        this.settings.set(this.generatePath("repos", repoName), undefined);
    }

    public setPackageProperty(packageName: string, propertyName: PackagePropertyName, value: any): void {
        if (!String.isString(packageName)) {
            throw new Error("packageName (string) must be provided.");
        }

        if (!String.isString(propertyName)) {
            throw new Error("propertyName (string) must be provided.");
        }

        this.settings.set(this.generatePath("packages", packageName, propertyName), value);
    }

    public getPackageProperty(packageName: string, propertyName: PackagePropertyName): any {
        if (!String.isString(packageName)) {
            throw new Error("packageName (string) must be provided.");
        }

        if (!String.isString(propertyName)) {
            throw new Error("propertyName (string) must be provided.");
        }

        return this.settings.get(this.generatePath("packages", packageName, propertyName));
    }

    private generatePath(...segements: Array<string>): string {
        if (!this.sectionName) {
            return segements.join("/");
        }

        return this.sectionName + "/" + segements.join("/");
    }
}

class PackageManager implements IPackageManager {
    private settings: PackageManagerSettings;

    constructor(settings: ISettings) {
        if (!Object.isObject(settings)) {
            throw new Error("settings must be provided.");
        }

        this.settings = new PackageManagerSettings(settings, "package-manager");
    }

    public addRepo(repoConfig: IPackageRepositoryConfig): void {
        this.settings.addRepo(repoConfig);
    }

    public removeRepo(repoName: string): void {
        this.settings.removeRepo(repoName);
    }

    public getRepos(): Array<IPackageRepository> {
        return this.getRepoConfigs().map((repoConfig) => new PackageRepository(repoConfig));
    }

    public getRepoConfigs(): Array<IPackageRepositoryConfig> {
        return this.settings.getRepoConfigs();
    }

    public installPackage(repo: string, packageName: string): void {
        throw new Error("Method not implemented.");
    }

    public uninstallPackage(packageName: string): void {
        throw new Error("Method not implemented.");
    }

    public setPackageProperty(packageName: string, propertyName: PackagePropertyName, value: any): void {
        this.settings.setPackageProperty(packageName, propertyName, value);
    }

    public getPackageProperty(packageName: string, propertyName: PackagePropertyName) {
        return this.settings.getPackageProperty(packageName, propertyName);
    }

    public shouldLoad(moduleManager: IModuleManager, nameOrInfo: string | IModuleInfo): boolean {
        if (!String.isString(nameOrInfo)) {
            return true;
        }

        return this.settings.getPackageProperty(nameOrInfo, "Enabled");
    }
}

export function getModuleMetadata(): IModuleInfo {
    return {
        name: "package-manager",
        version: electron.app.getVersion(),
        components: [
            {
                name: "settings.service",
                version: electron.app.getVersion(),
                singleton: true,
                descriptor: (settings: ISettings) => new PackageManager(settings),
                deps: ["settings"]
            }
        ]
    };
}
