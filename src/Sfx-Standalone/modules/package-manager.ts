//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IDictionary } from "sfx.common";
import { ISettings } from "sfx.settings";
import { IModuleManager, IModuleInfo, IModuleLoadingPolicy } from "sfx.module-manager";
import {
    IPackageManager,
    IPackageRepository,
    IPackageRepositoryConfig,
    IPackageInfo,
    ISearchResult
} from "sfx.package-manager";
import { IHttpClient } from "sfx.http";

import * as path from "path";
import * as http from "http";
import * as crypto from "crypto";
import * as tar from "tar";
import * as fs from "fs";
import * as tmp from "tmp";

import { electron } from "../utilities/electron-adapter";
import * as appUtils from "../utilities/appUtils";
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
    export interface IContinuationToken {
        text: string;
        offset: number;
        size: number;
    }

    export interface ILinks {
        npm: string;
        homepage: string;
        repository: string;
        bugs: string;
    }

    export interface ISearchResultPackage {
        name: string;
        version: string;
        description: string;
        keywords: Array<string>;
        date: Date;
        links: ILinks;
        publisher: IContact | string;
        maintainers: Array<IContact | string>;
    }

    export interface ISearchResultStoreDetail {
        quality: number;
        popularity: number;
        maintenance: number;
    }

    export interface ISearchResultScore {
        final: number;
        detail: ISearchResultStoreDetail;
    }

    export interface ISearchResultItem {
        package: ISearchResultPackage;
        score: ISearchResultScore;
        searchScore: number;
    }

    export interface ISearchResult {
        objects: Array<ISearchResultItem>;
        total: number;
        time: Date;
    }

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
        homepage?: string;
        repository?: ISourceRepository;
        author: IContact | string;
        license?: string;
        dist?: IDistribution;
        maintainers?: Array<IContact | string>;
        keywords?: Array<string>;
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

    export interface IModuleInfo {
        name: string;
        description: string;
        "dist-tags": IDistTags;
        versions: IDictionary<INpmPackage>;
        readme: string;
        maintainers: Array<IContact | string>;
        author: IContact | string;
        repository: ISourceRepository;
        readmeFilename: string;
        homepage: string;
        bugs: IIssueSite;
        license: string;
        keywords: Array<string>;
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

function ModuleInfoToPackageInfo(moduleInfo: NpmRegistry.IModuleInfo): IPackageInfo {
    const versionInfo = moduleInfo.versions[moduleInfo["dist-tags"].latest];
    const keywords = new Array<string>();

    if (Array.isArray(moduleInfo.keywords)) {
        keywords.push(...moduleInfo.keywords);
    }

    if (Array.isArray(versionInfo.keywords)) {
        keywords.push(...versionInfo.keywords);
    }

    return {
        name: moduleInfo.name,
        description: moduleInfo.description,
        version: versionInfo.version,
        readme: moduleInfo.readme,
        maintainers: moduleInfo.maintainers,
        author: moduleInfo.author,
        sourceRepository: moduleInfo.repository,
        homepage: moduleInfo.homepage,
        license: versionInfo.license,
        keywords: keywords
    };
}

function NpmPackageToPackageInfo(npmPackage: NpmRegistry.INpmPackage): IPackageInfo {
    return {
        name: npmPackage.name,
        description: npmPackage.description,
        version: npmPackage.version,
        maintainers: npmPackage.maintainers,
        author: npmPackage.author,
        sourceRepository: npmPackage.repository,
        homepage: npmPackage.homepage,
        license: npmPackage.license,
        keywords: npmPackage.keywords
    };
}

function SearchResultPackageToPackageInfo(packageInfo: NpmRegistry.ISearchResultPackage): IPackageInfo {
    return {
        name: packageInfo.name,
        description: packageInfo.description,
        version: packageInfo.version,
        maintainers: packageInfo.maintainers,
        author: packageInfo.publisher,
        homepage: packageInfo.links.homepage,
        keywords: packageInfo.keywords
    };
}

function toSearchResult(npmSearchResult: NpmRegistry.ISearchResult): ISearchResult {
    return {
        continuationToken: null,
        packages: npmSearchResult.objects.map((obj) => SearchResultPackageToPackageInfo(obj.package))
    };
}

class PackageRepository implements IPackageRepository {
    private readonly packagesDir: string;
    private readonly httpClient: IHttpClient;
    private readonly config: IPackageRepositoryConfig;

    public get name() {
        return this.config.name;
    }

    public get url() {
        return this.config.url;
    }

    public async installPackageAsync(packageName: string): Promise<boolean> {
        const moduleInfo = await this.getModuleInfoAsync(packageName);

        if (!moduleInfo) {
            return false;
        }

        const versionConfig = moduleInfo.versions[moduleInfo["dist-tags"].latest];
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

    public async getPackageMetadataAsync(packageName: string): Promise<IPackageInfo> {
        return ModuleInfoToPackageInfo(await this.getModuleInfoAsync(packageName));
    }

    public searchAsync(text: string, resultSize: number, offset?: number): Promise<ISearchResult> {
        if (!String.isString(text) || String.isEmptyOrWhitespace(text)) {
            throw new Error("text must be provided.");
        }

        if (!Number.isSafeInteger(resultSize)) {
            throw new Error("resultSize must be a safe integer.");
        }

        resultSize = resultSize < 0 ? 20 : resultSize;

        if (!utils.isNullOrUndefined(offset) && !Number.isSafeInteger(offset)) {
            throw new Error("offset must be a safe integer.");
        }

        offset = offset && offset >= 0 ? offset : 0;

        const searchUrl = new URL("/-/v1/search", this.config.url);

        searchUrl.searchParams.append("text", text);
        searchUrl.searchParams.append("size", resultSize.toString());
        searchUrl.searchParams.append("from", offset.toString());

        return this.httpClient.getAsync(searchUrl.href)
            .then((npmSearchResult) => {
                if (npmSearchResult instanceof http.IncomingMessage) {
                    return Promise.reject(new Error(`Failed to search (${searchUrl}): HTTP${npmSearchResult.statusCode} => ${npmSearchResult.statusMessage}`));
                }

                const searchResult = toSearchResult(npmSearchResult);

                searchResult.continuationToken = JSON.stringify(<NpmRegistry.IContinuationToken>{
                    size: resultSize,
                    offset: offset,
                    text: text
                });

                return Promise.resolve(searchResult);
            });
    }

    public searchNextAsync(continuationToken: string): Promise<ISearchResult> {
        if (!String.isString(continuationToken) || String.isEmptyOrWhitespace(continuationToken)) {
            throw new Error("continuationToken must be provided.");
        }

        const token: NpmRegistry.IContinuationToken = JSON.parse(continuationToken);

        return this.searchAsync(token.text, token.size, token.offset + token.size);
    }

    constructor(packagesDir: string, httpClient: IHttpClient, repoConfig: IPackageRepositoryConfig) {
        this.packagesDir = packagesDir;
        this.httpClient = httpClient;
        this.config = repoConfig;
    }

    private getModuleInfoAsync(packageName: string): Promise<NpmRegistry.IModuleInfo> {
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

const PackageManagerSettingsName = "package-manager";

class PackageManager implements IPackageManager {
    private httpClient: IHttpClient;

    private config: IPackageManagerConfig;

    private repos: IDictionary<IPackageRepository>;

    public get packagesDir(): string {
        return this.config.packagesDir;
    }

    constructor(settings: ISettings, httpClient: IHttpClient) {
        if (!Object.isObject(settings)) {
            throw new Error("settings must be provided.");
        }

        if (!Object.isObject(httpClient)) {
            throw new Error("httpClient must be provided.");
        }

        this.repos = Object.create(null);
        this.httpClient = httpClient;
        this.config = settings.get(PackageManagerSettingsName);

        if (!Object.isObject(this.config.repos)) {
            this.config.repos = Object.create(null);
        }

        if (!Object.isObject(this.config.packages)) {
            this.config.packages = Object.create(null);
        }

        if (!String.isString(this.config.packagesDir)) {
            this.config.packagesDir = path.resolve(electron.app.getPath("userData"), "packages");
        } else {
            this.config.packagesDir = path.resolve(electron.app.getPath("userData"), this.config.packagesDir);
        }

        fileSystem.ensureDirExists(this.config.packagesDir);

        this.loadInstalledPackageInfos(true);
    }

    public addRepo(repoConfig: IPackageRepositoryConfig): void {
        if (!isPackageRepositoryConfig(repoConfig)) {
            throw new Error("A valid repoConfig must be provided.");
        }

        this.config.repos[repoConfig.name] = repoConfig;
    }

    public removeRepo(repoName: string): void {
        delete this.config.repos[repoName];
    }

    public getRepo(repoName: string): IPackageRepository {
        if (!String.isString(repoName)) {
            throw new Error("A valid repoName must be provided.");
        }

        const repoConfig = this.config.repos[repoName];

        if (!repoConfig) {
            return undefined;
        }

        let repo = this.repos[repoConfig.url];

        if (!repo) {
            repo = new PackageRepository(this.config.packagesDir, this.httpClient, repoConfig);
            this.repos[repoConfig.url] = repo;
        }

        return repo;
    }

    public getRepoByUrl(repoUrlString: string): IPackageRepository {
        const repoUrl = new URL(repoUrlString);

        let repo = this.repos[repoUrl.href];

        if (!repo) {
            repo = new PackageRepository(this.config.packagesDir, this.httpClient, { url: repoUrl.href });
            this.repos[repoUrl.href] = repo;
        }

        return repo;
    }

    public getRepoConfig(repoName: string): IPackageRepositoryConfig {
        if (!String.isString(repoName) || String.isEmptyOrWhitespace(repoName)) {
            throw new Error("repoName must be provided.");
        }

        return this.config.repos[repoName];
    }

    public getRepos(): Array<IPackageRepository> {
        return Object.keys(this.config.repos).map((repoName) => this.getRepo(repoName));
    }

    public getRepoConfigs(): Array<IPackageRepositoryConfig> {
        return Object.values(this.config.repos);
    }

    public getInstalledPackageInfos(): Array<IPackageInfo> {
        return this.loadInstalledPackageInfos(false);
    }

    public uninstallPackage(packageName: string): void {
        if (!String.isString(packageName) || String.isEmptyOrWhitespace(packageName)) {
            throw new Error("packageName must be provided.");
        }

        fileSystem.rmdir(path.join(this.config.packagesDir, packageName));
    }

    public relaunch(): void {
        electron.app.relaunch();
        electron.app.quit();
    }

    public enablePackage(packageName: string, enable?: boolean): void {
        if (!String.isString(packageName) || String.isEmptyOrWhitespace(packageName)) {
            throw new Error("packageName must be provided.");
        }

        let packageConfig = this.config.packages[packageName];

        if (!packageConfig) {
            this.config.packages[packageName] = {
                enabled: true
            };

            packageConfig = this.config.packages[packageName];
        }

        packageConfig.enabled = utils.getValue(enable, true);
    }

    private loadInstalledPackageInfos(removeUninstalled: boolean): Array<IPackageInfo> {
        const packageInfos = new Array<IPackageInfo>();
        const knownPackageNames =
            new Set(
                Object.keys(this.config.packages)
                    .concat(fs.readdirSync(this.config.packagesDir)));

        for (const packageName of knownPackageNames) {
            const subDir = path.join(this.config.packagesDir, packageName);

            if (!fs.existsSync(subDir)) {
                if (!removeUninstalled) {
                    packageInfos.push({
                        name: packageName,
                        version: null,
                        maintainers: null,
                        author: null,
                        status: "Uninstalled"
                    });
                } else {
                    delete this.config.packages[packageName];
                }

                continue;
            }

            const stat = fs.statSync(subDir);

            if (!stat.isDirectory()) {
                continue;
            }

            const packageInfo = NpmPackageToPackageInfo(JSON.parse(fs.readFileSync(path.join(subDir, "package.json"), { encoding: "utf8" })));
            const packageConfig = this.config.packages[packageInfo.name];

            packageInfo.status = "Installed";

            if (packageConfig) {
                packageInfo.status = packageConfig.enabled ? "Enabled" : "Disabled";
            }

            packageInfos.push(packageInfo);
        }

        return packageInfos;
    }
}

class ModuleLoadingPolicy implements IModuleLoadingPolicy {
    private readonly config: IPackageManagerConfig;

    constructor(settings: ISettings) {
        this.config = settings.get(PackageManagerSettingsName);
    }

    public shouldLoad(moduleManager: IModuleManager, nameOrInfo: string | IModuleInfo): boolean {
        if (!String.isString(nameOrInfo)) {
            return true;
        }

        const packageConfig = this.config.packages[nameOrInfo];

        if (!packageConfig) {
            this.config.packages[nameOrInfo] = {
                enabled: true
            };

            return true;
        }

        if (packageConfig.enabled === false) {
            return false;
        }

        return true;
    }
}

export function getModuleMetadata(): IModuleInfo {
    return {
        name: "package-manager",
        version: appUtils.getAppVersion(),
        components: [
            {
                name: "package-manager",
                version: appUtils.getAppVersion(),
                singleton: true,
                descriptor: (settings: ISettings, httpsClient: IHttpClient) => new PackageManager(settings, httpsClient),
                deps: ["settings", "http.https-client"]
            }
        ]
    };
}

export async function initializeAsync(moduleManager: IModuleManager): Promise<void> {
    moduleManager.setModuleLoadingPolicy(new ModuleLoadingPolicy(await moduleManager.getComponentAsync("settings")));
}
