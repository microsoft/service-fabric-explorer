//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IModuleManager, IModuleInfo } from "sfx.module-manager";
import { IPackageManager } from "sfx.package-manager";

class PackageManager implements IPackageManager {
    public addRepo(repoConfig: import("sfx.package-manager").IPackageRepositoryConfig): void {
        throw new Error("Method not implemented.");
    }

    public removeRepo(repoName: string): void {
        throw new Error("Method not implemented.");
    }

    public getRepos(): import("sfx.package-manager").IPackageRepository[] {
        throw new Error("Method not implemented.");
    }

    public getRepoConfigs(): import("sfx.package-manager").IPackageRepositoryConfig[] {
        throw new Error("Method not implemented.");
    }

    public installPackage(repo: string, packageName: string): void {
        throw new Error("Method not implemented.");
    } 
    
    public uninstallPackage(packageName: string): void {
        throw new Error("Method not implemented.");
    }

    public setPackageProperty(packageName: string, propertyName: "Enabled", value: any): void {
        throw new Error("Method not implemented.");
    }

    public getPackageProperty(packageName: string, propertyName: "Enabled") {
        throw new Error("Method not implemented.");
    }

    public shouldLoad(moduleManager: IModuleManager, nameOrInfo: string | IModuleInfo): boolean {
        throw new Error("Method not implemented.");
    }
}
