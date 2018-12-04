//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "sfx.logging" {
    export interface ILoggerSettings extends Donuts.Logging.ILoggerSettings {
        name: string;
        component: string;
    }
}

declare module "sfx.module-manager" {
    import { ILoggerSettings } from "sfx.logging";

    export interface ISfxModuleManager {
        getComponentAsync(componentIdentity: "logging.default"): Promise<Donuts.Logging.ILog>;
        getComponentAsync(componentIdentity: "logging.logger.console", settings?: ILoggerSettings): Promise<Donuts.Logging.ILogger>;
        getComponentAsync(componentIdentity: "logging.logger.app-insights", settings: ILoggerSettings): Promise<Donuts.Logging.ILogger>;
    }
}
