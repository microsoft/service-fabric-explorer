//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "sfx.prompt.select-certificate" {
    import { Certificate } from "electron";
}

declare module "sfx.module-manager" {
    import { IPrompt } from "sfx.prompt";
    import { ICertificateInfo, ICertificate } from "sfx.cert";

    export interface ISfxModuleManager {
        getComponentAsync(
            componentIdentity: "prompt.select-certificate",
            certInfos: Array<ICertificateInfo>): Promise<IPrompt<ICertificateInfo | ICertificate>>;
    }
}
