//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IModuleInfo, IModule } from "sfx.module-manager";
import { IPkiCertificateService, ICertificateLoader } from "sfx.cert";

import * as appUtils from "../../utilities/appUtils";
import { PkiService } from "./pki-service";
import { CertLoader } from "./cert-loader";

(<IModule>exports).getModuleMetadata = (components): IModuleInfo => {
    components
        .register<IPkiCertificateService>({
            name: "cert.pki-service",
            version: appUtils.getAppVersion(),
            singleton: true,
            descriptor: async () => new PkiService()
        })
        .register<ICertificateLoader>({
            name: "cert.cert-loader",
            version: appUtils.getAppVersion(),
            singleton: true,
            descriptor: async () => new CertLoader()
        });

    return {
        name: "cert",
        version: appUtils.getAppVersion()
    };
};
