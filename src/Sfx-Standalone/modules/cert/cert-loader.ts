//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { ICertificateLoader, IPfxCertificate, IPemCertificate } from "sfx.cert";
import * as utils from "donuts.node/utils";
import { promisify } from "util";
import { readFile } from "fs";

const readFileAsync = promisify(readFile);

export class CertLoader implements ICertificateLoader {
    public async loadPfxAsync(path: string, password?: string): Promise<IPfxCertificate> {
        const cert: IPfxCertificate = Object.create(null);

        cert.type = "pfx";
        cert.pfx = await readFileAsync(path);

        if (password) {
            if (!utils.isString(password)) {
                throw new Error("password must be a string.");
            }

            cert.password = password;
        }

        return cert;
    }

    public async loadPemAsync(certPath: string, keyPath?: string, keyPassword?: string): Promise<IPemCertificate> {
        const cert: IPemCertificate = Object.create(null);

        cert.type = "pem";
        cert.cert = await readFileAsync(certPath);

        if (keyPassword) {
            if (!utils.isString(keyPassword)) {
                throw new Error("keyPassword must be a string.");
            }

            cert.password = keyPassword;
        }

        if (keyPath) {
            cert.key = await readFileAsync(keyPath);
        }

        return cert;
    }
}
