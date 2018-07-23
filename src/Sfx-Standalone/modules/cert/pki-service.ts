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

import { exec } from "child_process";
import { promisify } from "util";
import { env, Platform } from "../../utilities/env";
import { local } from "../../utilities/appUtils";

const execAsync = promisify(exec);

enum StoreNames {
    My = "My"
}

export class PkiService implements IPkiCertificateService {
    public async getCertificateInfosAsync(storeName: StoreName): Promise<Array<ICertificateInfo>> {
        if (env.platform !== Platform.Windows) {
            return undefined;
        }

        if (!Object.values(StoreNames).includes(storeName)) {
            throw new Error(`Invalid storeName: ${storeName}`);
        }

        const outputs = await execAsync(`powershell "${local("./windows/Get-Certificates.ps1")}" -StoreName "${storeName}"`, { encoding: "utf8" });
        const certJsonObjects: Array<ICertificateInfo> = JSON.parse(outputs.stdout);

        for (const certJsonObject of certJsonObjects) {
            certJsonObject.validExpiry = new Date(certJsonObject.validExpiry);
            certJsonObject.validStart = new Date(certJsonObject.validStart);
        }

        return certJsonObjects;
    }

    public async getCertificateAsync(certInfo: ICertificateInfo): Promise<IPfxCertificate> {
        if (!certInfo
            || !certInfo.thumbprint
            || !String.isString(certInfo.thumbprint)) {
            throw new Error("Invalid certInfo: missing thumbprint.");
        }

        const cmdOutputs = await execAsync(`powershell "${local("./windows/Get-PfxCertificateData.ps1")}" -Thumbprint "${certInfo.thumbprint}"`, { encoding: "utf8" });
        const pfxBase64Data = cmdOutputs.stdout;

        if (pfxBase64Data === "undefined") {
            return undefined;
        }

        const pfxCert: IPfxCertificate = Object.create(null);

        pfxCert.type = "pfx";
        pfxCert.pfx = Buffer.from(pfxBase64Data, "base64");

        return pfxCert;
    }
}
