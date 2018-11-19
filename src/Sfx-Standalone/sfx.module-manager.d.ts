//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "sfx.module-manager" {
    export interface ISfxModuleManager extends Donuts.Modularity.IModuleManager {
        getComponentAsync<T>(componentIdentity: string, ...extraArgs: Array<any>): Promise<Donuts.Modularity.Component<T>>;
    }
}
