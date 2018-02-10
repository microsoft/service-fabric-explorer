//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { ISettings } from "../../@types/settings";
import { ILoggerSettings } from "../../@types/log";
import { Log } from "./log";
import ConsoleLogger from "./console";
import AppInsightsLogger from "./app-insights";

export function getModuleMetadata(): IModuleInfo {
    return {
        name: "log",
        version: "1.0.0",
        components: [
            {
                name: "log",
                version: "1.0.0",
                descriptor: (moduleManager: IModuleManager, settings: ISettings) => new Log(moduleManager, settings.get("logging")),
                singleton: true,
                deps: ["module-manager", "settings"]
            },
            {
                name: "loggers.console",
                version: "1.0.0",
                descriptor: (loggerSettings: ILoggerSettings, targetConsole: Console) => new ConsoleLogger(loggerSettings, targetConsole)
            },
            ,
            {
                name: "loggers.app-insights",
                version: "1.0.0",
                descriptor: (loggerSettings: ILoggerSettings) => new AppInsightsLogger(loggerSettings)
            }
        ]
    };
}


