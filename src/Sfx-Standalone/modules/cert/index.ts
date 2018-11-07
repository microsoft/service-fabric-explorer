//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IPkiCertificateService, ICertificateLoader } from "sfx.cert";

import * as shell from "donuts.node/shell";

(<Donuts.Modularity.IModule>exports).getModuleMetadata = (components): Donuts.Modularity.IModuleInfo => {
    components
        .register<IPkiCertificateService>({
            name: "cert.pki-service",
            version: shell.getAppVersion(),
            singleton: true,
            descriptor: async () => import("./pki-service").then((module) => new module.PkiService())
        })
        .register<ICertificateLoader>({
            name: "cert.cert-loader",
            version: shell.getAppVersion(),
            singleton: true,
            descriptor: async () => import("./cert-loader").then((module) => new module.CertLoader())
        });

    return {
        name: "cert",
        version: shell.getAppVersion()
    };
};
