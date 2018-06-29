//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import {
    IPkiCertificateService,
    ICertificateInfo,
    StoreName,
    IPfxCertificate
} from "sfx.cert";

import { execSync } from "child_process";
import { local } from "../../utilities/appUtils";

enum StoreNames {
    My = "My"
}

export class PkiService implements IPkiCertificateService {
    public getCertificateInfos(storeName: StoreName): Array<ICertificateInfo> {
        if (!Object.values(StoreNames).includes(storeName)) {
            throw new Error(`Invalid storeName: ${storeName}`);
        }

        const certsJson = execSync(`powershell "${local("./windows/Get-Certificates.ps1")}" -StoreName "${storeName}"`, { encoding: "utf8" });
        const certJsonObjects: Array<ICertificateInfo> = JSON.parse(certsJson);

        for (const certJsonObject of certJsonObjects) {
            certJsonObject.validExpiry = new Date(certJsonObject.validExpiry);
            certJsonObject.validStart = new Date(certJsonObject.validStart);
        }

        return certJsonObjects;
    }

    public getCertificate(certInfo: ICertificateInfo): IPfxCertificate {
        if (!certInfo
            || !certInfo.thumbprint
            || !String.isString(certInfo.thumbprint)) {
            throw new Error("Invalid certInfo: missing thumbprint.");
        }

        const pfxBase64Data = execSync(`powershell "${local("./windows/Get-PfxCertificateData.ps1")}" -Thumbprint "${certInfo.thumbprint}"`, { encoding: "utf8" });

        if (pfxBase64Data === "undefined") {
            return undefined;
        }

        const pfxCert: IPfxCertificate = Object.create(null);

        pfxCert.type = "pfx";
        pfxCert.pfx = Buffer.from(pfxBase64Data, "base64");

        return pfxCert;
    }
}
