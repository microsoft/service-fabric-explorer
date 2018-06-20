//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "sfx.package-manager" {
    import { IDictionary } from "sfx.common";
    import { IModuleLoadingPolicy } from "sfx.module-manager";

    export interface IPackageRepositoryConfig {
        readonly type: string;
        readonly name: string;
        readonly url: string;
    }

    export interface ISearchResult {
        continueToken: string;
    }

    export interface IPackageMetadata {

    }

    export interface IPackageInfo {

    }

    export interface IPackageRepository extends IPackageRepositoryConfig {
        installPackageAsync(packageName: string): Promise<boolean>;
        getPackageMetadataAsync(packageName: string): Promise<IPackageMetadata>;
        searchAsync(text: string, resultSize: number): Promise<ISearchResult>;
    }

    export interface IPackageManager extends IModuleLoadingPolicy {
        addRepo(repoConfig: IPackageRepositoryConfig): void;
        removeRepo(repoName: string): void;
        getRepo(repoName: string): IPackageRepository;
        getRepoConfig(repoName: string): IPackageRepositoryConfig;

        getRepos(): Array<IPackageRepository>;
        getRepoConfigs(): Array<IPackageRepositoryConfig>;

        getInstalledPackageInfos(): Array<IPackageInfo>;

        uninstallPackage(packageName: string): void;
    }
}

declare module "sfx.module-manager" {
    import { IPackageManager } from "sfx.package-manager";

    export interface IModuleManager {
        getComponentAsync(componentIdentity: "package-manager"): Promise<IPackageManager>;
    }
}
