//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IModuleInfo, IModule } from "sfx.module-manager";

import * as appUtils from "../../utilities/appUtils";
import { Utils } from "./utils";

import StringPattern from "./pattern/string";
import RegexPattern from "./pattern/regex";

exports = <IModule>{
    getModuleMetadata: (components): IModuleInfo => {
        components
            .register<any>({
                name: "remoting.utils",
                version: appUtils.getAppVersion(),
                singleton: true,
                descriptor: async () => new Utils()
            })
            .register<any>({
                name: "remoting.pattern.string",
                version: appUtils.getAppVersion(),
                singleton: false,
                descriptor: async (pattern: string) => new StringPattern(pattern)
            })
            .register<any>({
                name: "remoting.pattern.string",
                version: appUtils.getAppVersion(),
                singleton: false,
                descriptor: async (pattern: RegExp) => new RegexPattern(pattern)
            });

        return {
            name: "remoting",
            version: appUtils.getAppVersion(),
            loadingMode: "Always"
        };
    }
};
