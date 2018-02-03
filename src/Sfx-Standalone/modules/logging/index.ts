//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { Log } from "./log";
import { ConsoleLogger } from "./console";
import { AppInsightsLogger } from "./app-insights";

export function getModuleMetadata(): IModuleInfo {
    return {
        name: "log",
        version: "1.0.0",
        components: [
            {
                name: "log",
                version: "1.0.0",
                descriptor: (moduleManager, settings) => new Log(moduleManager, settings),
                singleton: true,
                deps: ["module-manager", "settings"]
            },
            {
                name: "loggers.console",
                version: "1.0.0",
                descriptor: (loggerSettings, targetConsole) => new ConsoleLogger(loggerSettings, targetConsole)
            },
            ,
            {
                name: "loggers.appinsights",
                version: "1.0.0",
                descriptor: (loggerSettings) => new AppInsightsLogger(loggerSettings)
            }
        ]
    };
}


