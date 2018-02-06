//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
import { env, Platform } from "./env";
import { local } from "./resolve";

export function getIconPath(): string {
    switch (env.platform) {
        case Platform.Windows:
            return local("../icons/icon.ico");

        case Platform.MacOs:
            return local("../icons/icon.icns");

        case Platform.Linux:
        default:
            return local("../icons/icon128x128.png");
    }
}

export const appCodeName: string = require("../package.json").name;
