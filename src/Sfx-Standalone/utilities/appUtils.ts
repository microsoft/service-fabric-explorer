//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { local } from "donuts.node/path";

export function getIconPath(): string {
    switch (process.platform) {
        case "win32":
            return local("./icons/icon.ico", true);

        case "darwin":
            return local("./icons/icon.icns", true);

        case "linux":
        default:
            return local("./icons/icon128x128.png", true);
    }
}

export function logUnhandledRejection(): void {
    process.on("unhandledRejection", (reason, promise) => {
        if (sfxModuleManager) {
            sfxModuleManager.getComponentAsync<Donuts.Logging.ILog>("logging")
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

export function injectModuleManager(moduleManager: Donuts.Modularity.IModuleManager): void {
    Object.defineProperty(global, "sfxModuleManager", {
        writable: false,
        configurable: false,
        enumerable: false,
        value: moduleManager
    });
}
