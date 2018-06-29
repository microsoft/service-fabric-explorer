//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { ICertificateLoader, IPfxCertificate, IPemCertificate } from "sfx.cert";

import * as fs from "fs";

export class CertLoader implements ICertificateLoader {
    public loadPfx(path: string, password?: string): IPfxCertificate {
        const cert: IPfxCertificate = Object.create(null);

        cert.type = "pfx";
        cert.pfx = fs.readFileSync(path);

        if (password) {
            if (!String.isString(password)) {
                throw new Error("password must be a string.");
            }

            cert.password = password;
        }

        return cert;
    }

    public loadPem(certPath: string, keyPath?: string, keyPassword?: string): IPemCertificate {
        const cert: IPemCertificate = Object.create(null);

        cert.type = "pem";
        cert.cert = fs.readFileSync(certPath);

        if (keyPassword) {
            if (!String.isString(keyPassword)) {
                throw new Error("keyPassword must be a string.");
            }

            cert.password = keyPassword;
        }

        if (keyPath) {
            cert.key = fs.readFileSync(keyPath);
        }

        return cert;
    }
}
