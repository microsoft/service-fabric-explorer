//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { Certificate } from "electron";

import { IPromptService, ISelectCertificatePromptResults } from "../../@types/prompt";
import { ICommunicator } from "../../@types/ipc";
import "../../utilities/utils";
import error from "../../utilities/errorUtil";
import resolve from "../../utilities/resolve";

function open(
    promptsvc: IPromptService,
    parentWindowId: number,
    certificates: Array<Certificate>,
    promptCallback: (error: any, results: ISelectCertificatePromptResults) => void = null): ICommunicator {

    if (!Object.isObject(promptsvc)) {
        throw error("promptsvc must be supplied.");
    }

    if (!Array.isArray(certificates)) {
        throw error("certificates must be supplied.");
    }

    return promptsvc.open(
        {
            parentWindowId: parentWindowId,
            pageUrl: resolve("select-certificate.html"),
            height: 640,
            data: certificates
        },
        promptCallback
    );
}


export function getModuleMetadata(): IModuleInfo {
    return {
        name: "prompt-select-certificate",
        version: "1.0.0",
        components: [
            {
                name: "prompt-select-certificate",
                version: "1.0.0",
                descriptor: open,
                deps: ["prompt-service"]
            }
        ]
    };
}


