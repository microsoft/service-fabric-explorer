//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

export interface IUpdateService {
    update(): void;

    requestVersionInfo(callback: (error, versionInfo: IVersionInfo) => void): void;
}

declare global {
    interface IModuleManager {
        getComponent(componentIdentity: "update-service"): IUpdateService;
    }
}
