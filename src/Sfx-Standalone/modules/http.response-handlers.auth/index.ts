//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { ILog } from "sfx.logging";
import { IModuleInfo } from "sfx.module-manager";

import * as appUtils from "../../utilities/appUtils";

import { handleCert } from "./cert";
import { handleAad } from "./aad";

export function getModuleMetadata(): IModuleInfo {
    return {
        name: "http.response-handlers.auth",
        version: appUtils.getAppVersion(),
        components: [
            {
                name: "http.response-handlers.auth.handle-cert",
                version: appUtils.getAppVersion(),
                descriptor: (log: ILog) => handleCert
            },
            {
                name: "http.response-handlers.auth.handle-aad",
                version: appUtils.getAppVersion(),
                descriptor: (log: ILog) => handleAad
            }
        ]
    };
}