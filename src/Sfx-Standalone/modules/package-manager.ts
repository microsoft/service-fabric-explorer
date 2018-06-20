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
import * as http from "http";
import * as crypto from "crypto";
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

namespace NpmRegistry {
    export interface IDistTags {
        latest: string;
        next: string;
    }

    export interface IDistribution {
        shasum: string;
        tarball: string;
    }

    export interface INpmPackage {
        name: string;
        description: string;
        version: string;
        homepage: string;
        repository: ISourceRepository;
        author: IContact;
        licenses: Array<ILicense>;
        dist: IDistribution;
        maintainers: Array<IContact>;
    }

    export interface IContact {
        name: string;
        email: string;
        url: string;
    }

    export interface ISourceRepository {
        type: string;
        url: string;
    }

    export interface IIssueSite {
        url: string;
    }

    export interface ILicense {
        type: string;
        url: string;
    }

    export interface IPackageConfig {
        name: string;
        description: string;
        "dist-tags": IDistTags;
        versions: IDictionary<INpmPackage>;
        readme: string;
        maintainers: Array<IContact>;
        author: IContact;
        repository: ISourceRepository;
        readmeFilename: string;
        homepage: string;
        bugs: IIssueSite;
        license: string;
    }
}

function isPackageRepositoryConfig(repoConfig: IPackageRepositoryConfig): boolean {
    return !utils.isNullOrUndefined(repoConfig)
        && String.isString(repoConfig.name)
        && String.isString(repoConfig.url);
}

function getHashAsync(hashName: string, filePath: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const hashProv = crypto.createHash(hashName);
        const fileStream = fs.createReadStream(filePath);

        fileStream.on("end", () => {
            hashProv.end();

            const hashResult = hashProv.read();

            if (String.isString(hashResult)) {
                resolve(hashResult);
            } else if (hashResult instanceof Buffer) {
                resolve(hashResult.toString("hex"));
            } else {
                reject(new Error("Unknown type of hash result."));
            }
        });

        fileStream.pipe(hashProv);
    });
}

class PackageRepository implements IPackageRepository {
    private readonly packagesDir: string;
    private readonly httpClient: IHttpClient;
    private readonly config: IPackageRepositoryConfig;

    public async installPackageAsync(packageName: string): Promise<boolean> {
        const packageConfig = await this.getPackageConfigAsync(packageName);

        if (!packageConfig) {
            return false;
        }

        const versionConfig = packageConfig.versions[packageConfig["dist-tags"].latest];
        const downloadedPackagePath = await this.downloadPackageAsync(versionConfig.dist.tarball);
        const shasum = await getHashAsync("sha1", downloadedPackagePath);

        if (versionConfig.dist.shasum !== shasum) {
            throw new Error(`The shasum (${shasum}) of downloaded package (packageName: ${packageName}) is different from the version config (${versionConfig.dist.shasum}).`);
        }

        const extractDir = tmp.dirSync().name;

        tar.extract({
            cwd: extractDir,
            file: downloadedPackagePath,
            sync: true
        });

        fileSystem.copyfiles(path.join(extractDir, "package"), path.join(this.packagesDir, packageName));
        return true;
    }

    public getPackageConfigAsync(packageName: string): Promise<NpmRegistry.IPackageConfig> {
        if (!String.isString(packageName) || String.isEmptyOrWhitespace(packageName)) {
            throw new Error("packageName must be provided.");
        }

        const packageConfigUrl = new URL(packageName, this.config.url);

        return this.httpClient.getAsync(packageConfigUrl.href)
            .then((response) => {
                if (response instanceof http.IncomingMessage) {
                    if (response.statusCode === 404) {
                        return undefined;
                    }

                    return Promise.reject(new Error(`Failed to request package config for package: ${packageConfigUrl}`));
                }

                return response;
            });
    }

    constructor(packagesDir: string, httpClient: IHttpClient, repoConfig: IPackageRepositoryConfig) {
        this.packagesDir = packagesDir;
        this.httpClient = httpClient;
        this.config = repoConfig;
    }

    private downloadPackageAsync(packageUrl: string): Promise<string> {
        return this.httpClient.getAsync(packageUrl)
            .then((response: http.IncomingMessage) => {
                if (response.statusCode >= 200 && response.statusCode < 300) {
                    return new Promise<string>((resolve, reject) => {
                        const tempFile: { name: string; fd: number } =
                            tmp.fileSync({ keep: true, postfix: path.extname(packageUrl) });
                        const packageTempStream = fs.createWriteStream(null, { fd: tempFile.fd, autoClose: true });

                        response.pipe(packageTempStream)
                            .on("error", (error) => reject(error))
                            .on("finish", () => {
                                packageTempStream.end();
                                resolve(tempFile.name);
                            });
                    });
                }

                return Promise.reject(
                    new Error(`Failed to download package (${packageUrl}): HTTP ${response.statusCode} => ${response.statusMessage}`));
            });
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
    }

    public uninstallPackage(packageName: string): void {
        if (!String.isString(packageName) || String.isEmptyOrWhitespace(packageName)) {
            throw new Error("packageName must be provided.");
        }

        fileSystem.rmdir(path.join(this.config.packagesDir, packageName));

        delete this.config.packages[packageName];
        this.saveConfig();
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
