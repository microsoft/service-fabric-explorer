//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
import { IModuleInfo } from "sfx.module-manager";

import createBrowserWindowAsync from "./browser-window";
import * as appUtils from "../../utilities/appUtils";

export function getModuleMetadata(): IModuleInfo {
    return {
        name: "browser-window",
        version: appUtils.getAppVersion(),
        components: [
            {
                name: "browser-window",
                version: appUtils.getAppVersion(),
                descriptor: createBrowserWindowAsync,
                deps: ["module-manager"]
            }
        ]
    };
}
