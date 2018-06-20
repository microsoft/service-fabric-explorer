//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IDictionary, IPackageInfo } from "sfx.common";
import { ISettings } from "sfx.settings";
import { IModuleManager, IModuleInfo } from "sfx.module-manager";
import {
    IPackageManager,
    IPackageRepository,
    IPackageRepositoryConfig
} from "sfx.package-manager";
import { IHttpClient } from "sfx.http";

import * as path from "path";
import * as url from "url";
import * as tar from "tar";
import * as fs from "fs";
import * as tmp from "tmp";

import { electron } from "../utilities/electron-adapter";
import * as utils from "../utilities/utils";
import * as fileSystem from "../utilities/fileSystem";

interface IPackageConfig {
    enabled: boolean;
}

interface IPackageManagerConfig {
    packagesDir: string;
    repos: IDictionary<IPackageRepositoryConfig>;
    packages: IDictionary<IPackageConfig>;
}

function isPackageRepositoryConfig(repoConfig: IPackageRepositoryConfig): boolean {
    return !utils.isNullOrUndefined(repoConfig)
        && String.isString(repoConfig.name)
        && String.isString(repoConfig.url);
}

class PackageRepository implements IPackageRepository {
    private readonly packagesDir: string;
    private readonly httpClient: IHttpClient;
    private readonly config: IPackageRepositoryConfig;

    public installPackage(packageName: string): void {
        const packageUrl = new URL(packageName, this.config.url);
    }

    constructor(packagesDir: string, httpClient: IHttpClient, repoConfig: IPackageRepositoryConfig) {
        this.packagesDir = packagesDir;
        this.httpClient = httpClient;
        this.config = repoConfig;
    }
}

class PackageManager implements IPackageManager {
    private static readonly SettingsName = "package-manager";

    private httpClient: IHttpClient;

    private settings: ISettings;

    private config: IPackageManagerConfig;

    constructor(settings: ISettings, httpClient: IHttpClient) {
        if (!Object.isObject(settings)) {
            throw new Error("settings must be provided.");
        }

        if (!Object.isObject(httpClient)) {
            throw new Error("httpClient must be provided.");
        }

        this.httpClient = httpClient;
        this.settings = settings;
        this.config = this.settings.get(PackageManager.SettingsName);

        if (!Object.isObject(this.config.repos)) {
            this.config.repos = Object.create(null);
        }

        if (!Object.isObject(this.config.packages)) {
            this.config.packages = Object.create(null);
        }

        if (!String.isString(this.config.packagesDir)) {
            this.config.packagesDir = path.join(electron.app.getPath("userData"), "packages");
        } else {
            this.config.packagesDir = path.join(electron.app.getPath("userData"), this.config.packagesDir);
        }

        fileSystem.ensureDirExists(this.config.packagesDir);
    }

    public addRepo(repoConfig: IPackageRepositoryConfig): void {
        if (!isPackageRepositoryConfig(repoConfig)) {
            throw new Error("A valid repoConfig must be provided.");
        }

        this.config.repos[repoConfig.name] = repoConfig;
        this.saveConfig();
    }

    public removeRepo(repoName: string): void {
        delete this.config.repos[repoName];
        this.saveConfig();
    }

    public getRepo(repoName: string): IPackageRepository {
        if (!String.isString(repoName)) {
            throw new Error("A valid repoName must be provided.");
        }

        if (!this.config.repos[repoName]) {
            return undefined;
        }

        return new PackageRepository(this.config.packagesDir, this.httpClient, this.config.repos[repoName]);
    }

    public getRepoConfigs(): Array<IPackageRepositoryConfig> {
        return Object.values(this.config.repos);
    }

    public installPackage(repoName: string, packageName: string): void {
        const repo = this.getRepo(repoName);

        if (!repo) {
            throw new Error(`Unknown repo: ${repoName}`);
        }

        repo.installPackage(packageName);
        this.relaunch();
    }

    public uninstallPackage(packageName: string): void {
        if (!String.isString(packageName) || String.isEmptyOrWhitespace(packageName)) {
            throw new Error("packageName must be provided.");
        }

        fileSystem.rmdir(path.join(this.config.packagesDir, packageName));

        delete this.config.packages[packageName];
        this.saveConfig();
        this.relaunch();
    }

    public relaunch(): void {
        electron.app.relaunch();
        electron.app.quit();
    }

    public shouldLoad(moduleManager: IModuleManager, nameOrInfo: string | IModuleInfo): boolean {
        if (!String.isString(nameOrInfo)) {
            return true;
        }

        const packageConfig = this.config.packages[nameOrInfo];

        if (!packageConfig) {
            return true;
        }

        if (packageConfig.enabled === false) {
            return false;
        }

        return true;
    }

    private saveConfig(): void {
        this.settings.set(PackageManager.SettingsName, this.config);
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
                descriptor: (settings: ISettings, httpsClient: IHttpClient) => new PackageManager(settings, httpsClient),
                deps: ["settings", "http.https-client"]
            }
        ]
    };
}
