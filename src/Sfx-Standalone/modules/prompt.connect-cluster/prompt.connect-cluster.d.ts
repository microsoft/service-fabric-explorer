//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "sfx" {
    import { IPrompt } from "sfx.prompt";

    export interface IModuleManager {
        getComponentAsync(componentIdentity: "prompt.connect-cluster"): Promise<IPrompt<string>>;
    }
}
