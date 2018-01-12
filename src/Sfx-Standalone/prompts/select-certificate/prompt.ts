//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { Certificate, BrowserWindow } from "electron";
import * as util from "util";

import prompt from "../prompts";
import resolve from "../../utilities/resolve";
import error from "../../utilities/errorUtil";

export interface ISelectCertificatePromptResults {
    selectedCertificate?: Certificate;
    certificatesImported?: boolean;
}

export default function open(
    parentWindow: BrowserWindow,
    certificates: Array<Certificate>,
    promptCallback: (error: any, results: ISelectCertificatePromptResults) => void = null) {

    if (!util.isArray(certificates)) {
        throw error("certificates must be supplied.");
    }

    return prompt(
        {
            parentWindow: parentWindow,
            pageUrl: resolve("select-certificate.html"),
            height: 640,
            data: certificates
        },
        promptCallback
    );
}
