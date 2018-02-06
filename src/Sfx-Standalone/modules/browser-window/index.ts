//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import createBrowserWindow from "./browser-window";

export function getModuleMetadata(): IModuleInfo {
    return {
        name: "browser-window",
        version: "1.0.0",
        components: [
            {
                name: "browser-window",
                version: "1.0.0",
                descriptor: createBrowserWindow,
                deps: ["module-manager"]
            }
        ]
    };
}
