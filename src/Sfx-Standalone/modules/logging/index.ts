//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IModuleInfo, IModule } from "sfx.module-manager";
import { ISettings } from "sfx.settings";
import { ILoggerSettings, ILog, ILogger } from "sfx.logging";

import * as logging from "./log";
import ConsoleLogger from "./loggers/console";
import AppInsightsLogger from "./loggers/app-insights";
import * as appUtils from "../../utilities/appUtils";

(<IModule>exports).getModuleMetadata = (components): IModuleInfo => {
    components
        .register<ILog>({
            name: "logging",
            version: appUtils.getAppVersion(),
            descriptor:
                (settings: ISettings): Promise<ILog> =>
                    settings.getAsync("logging").then((loggingSettings) => logging.createAsync(loggingSettings)),
            singleton: true,
            deps: ["settings"]
        })
        .register<ILogger>({
            name: "logging.logger.console",
            version: appUtils.getAppVersion(),
            descriptor: async (loggerSettings: ILoggerSettings, targetConsole: Console) => new ConsoleLogger(loggerSettings, targetConsole)
        })
        .register<ILogger>({
            name: "logging.logger.app-insights",
            version: appUtils.getAppVersion(),
            descriptor: async (loggerSettings: ILoggerSettings) => new AppInsightsLogger(loggerSettings)
        });

    return {
        name: "logging",
        version: appUtils.getAppVersion()
    };
};
