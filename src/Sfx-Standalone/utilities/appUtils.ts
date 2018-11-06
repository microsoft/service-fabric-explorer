//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IDictionary } from "sfx.common";
import { IModuleManager } from "sfx.module-manager";

import * as path from "path";
import * as fs from "fs";
import * as url from "url";
import * as child_process from "child_process";

import { env, Platform } from "./env";

export function getIconPath(): string {
    switch (env.platform) {
        case Platform.Windows:
            return local("./icons/icon.ico", true);

        case Platform.MacOs:
            return local("./icons/icon.icns", true);

        case Platform.Linux:
        default:
            return local("./icons/icon128x128.png", true);
    }
}

export function logUnhandledRejection(): void {
    process.on("unhandledRejection", (reason, promise) => {
        if (sfxModuleManager) {
            sfxModuleManager.getComponentAsync("logging")
                .then((log) => {
                    if (log) {
                        log.writeErrorAsync("Unhandled promise rejection: {}", reason);
                    } else {
                        console.error("Unhandled promise rejection: ", promise);
                    }
                });
        } else {
            console.error("Unhandled promise rejection: ", promise);
        }
    });
}

export function injectModuleManager(moduleManager: IModuleManager): void {
    Object.defineProperty(global, "sfxModuleManager", {
        writable: false,
        configurable: false,
        enumerable: false,
        value: moduleManager
    });
}
