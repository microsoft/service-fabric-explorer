//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IModuleInfo } from "sfx.module-manager";

import * as appUtils from "../../utilities/appUtils";
import { Utils } from "./utils";

import StringPattern from "./pattern/string";
import RegexPattern from "./pattern/regex";

export function getModuleMetadata(): IModuleInfo {
    return {
        name: "remoting",
        version: appUtils.getAppVersion(),
        loadingMode: "Always",
        components: [
            {
                name: "remoting.utils",
                version: appUtils.getAppVersion(),
                singleton: true,
                descriptor: () => new Utils()
            },
            {
                name: "remoting.pattern.string",
                version: appUtils.getAppVersion(),
                singleton: false,
                descriptor: (pattern: string) => new StringPattern(pattern)
            },
            {
                name: "remoting.pattern.string",
                version: appUtils.getAppVersion(),
                singleton: false,
                descriptor: (pattern: RegExp) => new RegexPattern(pattern)
            }
        ]
    };
}
