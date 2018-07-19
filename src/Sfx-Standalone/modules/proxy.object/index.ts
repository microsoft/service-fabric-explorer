//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IModuleInfo, IModuleManager, IModule } from "sfx.module-manager";
import { ICommunicator, IRoutePattern } from "sfx.remoting";

import * as appUtils from "../../utilities/appUtils";
import { ObjectRemotingProxy } from "./proxy.object";
import * as utils from "../../utilities/utils";
import * as util from "util";

exports = <IModule>{
    getModuleMetadata: (components): IModuleInfo => {
        components.register<any>({
            name: "remoting.proxy",
            version: appUtils.getAppVersion(),
            deps: ["module-manager"],
            descriptor:
                async (moduleManager: IModuleManager, pattern: string | RegExp, communicator: ICommunicator, ownCommunicator?: boolean) => {
                    let routePattern: IRoutePattern;

                    if (utils.isNullOrUndefined(pattern)) {
                        routePattern = await moduleManager.getComponentAsync("remoting.pattern.string", "proxy.object");
                    } else if (String.isString(pattern)) {
                        routePattern = await moduleManager.getComponentAsync("remoting.pattern.string", pattern);
                    } else if (util.isRegExp(pattern)) {
                        routePattern = await moduleManager.getComponentAsync("remoting.pattern.regex", pattern);
                    } else {
                        throw new Error("The type of pattern is not suppored.");
                    }

                    return ObjectRemotingProxy.create(routePattern, communicator, ownCommunicator);
                }
        });

        return {
            name: "proxy.object",
            version: appUtils.getAppVersion(),
            loadingMode: "Always"
        };
    }
};
