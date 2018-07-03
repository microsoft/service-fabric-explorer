//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { ICertificateLoader, IPfxCertificate, IPemCertificate, ICertificate } from "sfx.cert";

import * as fs from "fs";

import * as utils from "../../utilities/utils";

export class CertLoader implements ICertificateLoader {
    private static isPfxClientCert(cert: ICertificate): cert is IPfxCertificate {
        return cert.type === "pfx"
            && (String.isString(cert["pfx"]) || cert["pfx"] instanceof Buffer);
    }

    private static isPemClientCert(cert: ICertificate): cert is IPemCertificate {
        return cert.type === "pem"
            && (String.isString(cert["key"]) || cert["key"] instanceof Buffer)
            && (String.isString(cert["cert"]) || cert["cert"] instanceof Buffer);
    }

    public load(cert: ICertificate): ICertificate {
        if (utils.isNullOrUndefined(cert)) {
            throw new Error("cert must be provided.");
        }

        if (CertLoader.isPemClientCert(cert)) {
            if (String.isString(cert.cert)) {
                cert.cert = fs.readFileSync(cert.cert);
            }

            if (String.isString(cert.key)) {
                cert.key = fs.readFileSync(cert.cert);
            }

        } else if (CertLoader.isPfxClientCert(cert)) {
            if (String.isString(cert.pfx)) {
                cert.pfx = fs.readFileSync(cert.pfx);
            }

        } else {
            throw new Error("Invalid certificate.");
        }

        return cert;
    }

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
