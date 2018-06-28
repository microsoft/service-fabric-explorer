//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "sfx.http.response-handlers.auth.cert" {
    import { ICertificate } from "sfx.common";

    export interface SelectCertAsyncHandler {
        (url: string, certs: Array<ICertificate>): Promise<ICertificate | Buffer>;
    }
}
