//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IPrompt } from "sfx.prompt";
import { ISelectCertificatePromptResults  } from "sfx.prompt.select-certificate";
import { Certificate } from "electron";

import "../../utilities/utils";
import resolve from "../../utilities/resolve";
import { electron } from "../../utilities/electron-adapter";

function open(
    prompt: IPrompt,
    parentWindowId: number,
    certificates: Array<Certificate>): Promise<IPrompt> {

    if (!Object.isObject(prompt)) {
        throw new Error("prompt must be supplied.");
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
        name: "prompt.select-certificate",
        version: electron.app.getVersion(),
        components: [
            {
                name: "prompt.select-certificate",
                version: electron.app.getVersion(),
                descriptor: open,
                deps: ["prompt"]
            }
        ]
    };
}


