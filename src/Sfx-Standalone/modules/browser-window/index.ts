//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
import { IModuleInfo } from "sfx.module-manager";

import createBrowserWindowAsync from "./browser-window";
import { electron } from "../../utilities/electron-adapter";

export function getModuleMetadata(): IModuleInfo {
    return {
        name: "browser-window",
        version: electron.app.getVersion(),
        components: [
            {
                name: "browser-window",
                version: electron.app.getVersion(),
                descriptor: createBrowserWindowAsync,
                deps: ["module-manager"]
            }
        ]
    };
}
