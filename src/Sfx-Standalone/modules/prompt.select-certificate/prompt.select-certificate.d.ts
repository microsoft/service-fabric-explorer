//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "sfx.prompt.select-certificate" {
    import { Certificate } from "electron";

    export interface ISelectCertificatePromptResults {
        selectedCertificate?: Certificate;
        certificatesImported?: boolean;
    }
}

declare module "sfx.module-manager" {
    import { IPrompt } from "sfx.prompt";
    import { ISelectCertificatePromptResults } from "sfx.prompt.select-certificate";
    import { Certificate } from "electron";

    export interface IModuleManager {
        getComponentAsync(
            componentIdentity: "prompt.select-certificate",
            parentWindowId: number,
            certificates: Array<Certificate>): Promise<IPrompt<ISelectCertificatePromptResults>>;
    }
}
