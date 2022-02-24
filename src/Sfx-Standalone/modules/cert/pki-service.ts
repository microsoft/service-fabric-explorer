//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import {
    IPkiCertificateService,
    ICertificateInfo,
    IPfxCertificate
} from "sfx.cert";

import { exec } from "child_process";
import { promisify } from "util";
import { local } from "donuts.node/path";
import * as utils from "donuts.node/utils";

const execAsync = promisify(exec);

enum StoreNames {
    My = "My"
}

export class PkiService implements IPkiCertificateService {
    public async getCertificateInfosAsync(storeName: StoreNames): Promise<Array<ICertificateInfo>> {
        if (process.platform !== "win32") {
            return undefined;
        }

        if (!Object.values(StoreNames).includes(storeName)) {
            throw new Error(`Invalid storeName: ${storeName}`);
        }

        const outputs = await execAsync(`powershell -ExecutionPolicy Bypass -File "${local("./windows/Get-Certificates.ps1")}" -StoreName "${storeName}"`, { encoding: "utf8" });
        const certJsonObjects: Array<ICertificateInfo> = JSON.parse(outputs.stdout);

        for (const certJsonObject of certJsonObjects) {
            certJsonObject.validExpiry = new Date(certJsonObject.validExpiry);
            certJsonObject.validStart = new Date(certJsonObject.validStart);
        }

        return certJsonObjects;
    }

    public async getCertificateAsync(thumbprint: string): Promise<IPfxCertificate> {
        if (!thumbprint
            || !utils.isString(thumbprint)) {
            throw new Error("Invalid certInfo: missing thumbprint.");
        }

        const cmdOutputs = await execAsync(`powershell -ExecutionPolicy Bypass -File "${local("./windows/Get-PfxCertificateData.ps1")}" -Thumbprint "${thumbprint}"`, { encoding: "utf8" });
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
