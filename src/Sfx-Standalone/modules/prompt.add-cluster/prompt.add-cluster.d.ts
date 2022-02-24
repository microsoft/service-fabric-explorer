//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------


declare module "sfx.prompt.add-cluster" {
    import { Certificate } from "electron";
}

declare module "sfx.module-manager" {
    import { IPrompt } from "sfx.prompt";
    import { ICluster } from "../main-window/cluster-list/data-model";

    export interface ISfxModuleManager {
        getComponentAsync(componentIdentity: "prompt.add-cluster"): Promise<IPrompt<ICluster>>;
    }
}
