//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "sfx.package-manager" {
    import { IDictionary } from "sfx.common";
    import { IModuleLoadingPolicy } from "sfx.module-manager";

    export type PackageStatus = "Installed" | "Enabled" | "Disabled" | "Uninstalled";

    export interface IPackageRepositoryConfig {
        readonly name?: string;
        readonly url: string;
    }

    export interface ISearchResult {
        continuationToken: string;
        packages: Array<IPackageInfo>;
    }

    export interface IContact {
        name: string;
        email: string;
        url?: string;
    }

    export interface ISourceRepository {
        type: string;
        url: string;
    }

    export interface IPackageInfo {
        name: string;
        description?: string;
        version: string;
        readme?: string;
        maintainers: Array<IContact | string>;
        author: IContact | string;
        sourceRepository?: ISourceRepository;
        homepage?: string;
        license?: string;
        keywords?: Array<string>;
        status?: PackageStatus;
    }

    export interface IPackageRepository {
        readonly config: Promise<IPackageRepositoryConfig>;

        installPackageAsync(packageName: string): Promise<boolean>;

        getPackageMetadataAsync(packageName: string): Promise<IPackageInfo>;

        searchAsync(text: string, resultSize: number): Promise<ISearchResult>;
        searchNextAsync(continuationToken: string): Promise<ISearchResult>;
    }

    export interface IPackageManager {
        readonly packagesDir: Promise<string>;

        addRepoAsync(repoConfig: IPackageRepositoryConfig): Promise<void>;
        removeRepoAsync(repoName: string): Promise<void>;

        getRepoAsync(repoName: string): Promise<IPackageRepository>;
        getRepoByUrlAsync(repoUrl: string): Promise<IPackageRepository>;
        getRepoConfigAsync(repoName: string): Promise<IPackageRepositoryConfig>;

        getReposAsync(): Promise<Array<IPackageRepository>>;
        getRepoConfigsAsync(): Promise<Array<IPackageRepositoryConfig>>;

        getInstalledPackageInfosAsync(): Promise<Array<IPackageInfo>>;

        enablePackageAsync(packageName: string, enable?: boolean): Promise<void>;

        uninstallPackageAsync(packageName: string): Promise<void>;
        relaunchAsync(): Promise<void>;
    }
}

declare module "sfx.module-manager" {
    import { IPackageManager } from "sfx.package-manager";

    export interface IModuleManager {
        getComponentAsync(componentIdentity: "package-manager"): Promise<IPackageManager>;
    }
}
