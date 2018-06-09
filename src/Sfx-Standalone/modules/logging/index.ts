//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IModuleInfo, IModuleManager } from "sfx";
import { ISettings } from "sfx.settings";
import { ILoggerSettings } from "sfx.logging";

import * as logging from "./log";
import ConsoleLogger from "./loggers/console";
import AppInsightsLogger from "./loggers/app-insights";
import { electron } from "../../utilities/electron-adapter";

export function getModuleMetadata(): IModuleInfo {
    return {
        name: "logging",
        version: electron.app.getVersion(),
        components: [
            {
                name: "logging",
                version: electron.app.getVersion(),
                descriptor: (settings: ISettings) => logging.create(settings.get("logging")),
                singleton: true,
                deps: ["settings"]
            },
            {
                name: "logging.logger.console",
                version: electron.app.getVersion(),
                descriptor: (loggerSettings: ILoggerSettings, targetConsole: Console) => new ConsoleLogger(loggerSettings, targetConsole)
            },
            {
                name: "logging.logger.app-insights",
                version: electron.app.getVersion(),
                descriptor: (loggerSettings: ILoggerSettings) => new AppInsightsLogger(loggerSettings)
            }
        ]
    };
}


