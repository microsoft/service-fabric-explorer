//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IModuleInfo } from "sfx.module-manager";

import * as appUtils from "../../utilities/appUtils";
import { PkiService } from "./pki-service";
import { CertLoader } from "./cert-loader";

export function getModuleMetadata(): IModuleInfo {
    return {
        name: "cert",
        version: appUtils.getAppVersion(),
        components: [
            {
                name: "cert.pki-service",
                version: appUtils.getAppVersion(),
                singleton: true,
                descriptor: () => new PkiService()
            },
            {
                name: "cert.cert-loader",
                version: appUtils.getAppVersion(),
                singleton: true,
                descriptor: () => new CertLoader()
            }
        ]
    };
}