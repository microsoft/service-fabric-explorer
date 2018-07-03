//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "sfx.cert" {
    export interface ICertificate {
        type: "pfx" | "pem";
    }

    export interface IPfxCertificate extends ICertificate {
        type: "pfx";
        password?: string;
        pfx: string | Buffer;
    }

    export interface IPemCertificate extends ICertificate {
        type: "pem";
        password?: string;
        key?: string | Buffer;
        cert: string | Buffer;
    }

    export interface ICertificateInfo {
        subjectName: string;
        issuerName: string;
        serialNumber: string;
        hasPrivateKey?: boolean;
        validStart: Date;
        validExpiry: Date;
        thumbprint: string;
    }

    export type StoreName = "My";

    export interface IPkiCertificateService {
        getCertificateInfos(storeName: StoreName): Array<ICertificateInfo>;
        getCertificate(certInfo: ICertificateInfo): IPfxCertificate;
    }

    export interface ICertificateLoader {
        load(cert: ICertificate): ICertificate;
        loadPfx(path: string, password?: string): IPfxCertificate;
        loadPem(certPath: string, keyPath?: string, keyPassword?: string): IPemCertificate;
    }
}

declare module "sfx.module-manager" {
    import { IPkiCertificateService, ICertificateLoader } from "sfx.cert";

    export interface IModuleManager {
        getComponentAsync(componentIdentity: "cert.pki-service"): Promise<IPkiCertificateService>;
        getComponentAsync(componentIdentity: "cert.cert-loader"): Promise<ICertificateLoader>;
    }
}
