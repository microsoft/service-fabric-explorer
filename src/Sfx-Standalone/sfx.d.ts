//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

/// <reference path="./common.d.ts" />

/// <reference path="./module-manager/module-manager.d.ts" />

/// <reference path="./modules/package-manager.d.ts" />
/// <reference path="./modules/settings.d.ts" />
/// <reference path="./modules/update.d.ts" />

/// <reference path="./modules/http/http.d.ts" />
/// <reference path="./modules/cert/cert.d.ts" />
/// <reference path="./modules/browser-window/browser-window.d.ts" />
/// <reference path="./modules/ipc/ipc.d.ts" />
/// <reference path="./modules/logging/logging.d.ts" />
/// <reference path="./modules/prompt/prompt.d.ts" />
/// <reference path="./modules/prompt.input/prompt.input.d.ts" />
/// <reference path="./modules/prompt.select-certificate/prompt.select-certificate.d.ts" />
/// <reference path="./modules/prompt.connect-cluster/prompt.connect-cluster.d.ts" />
/// <reference path="./modules/proxy.object/proxy.object.d.ts" />
/// <reference path="./modules/remoting/remoting.d.ts" />
/// <reference path="./modules/main-window/main-window.d.ts" />

declare module "sfx" {
    import { IModuleManager } from "sfx.module-manager";

    global {
        const sfxModuleManager: IModuleManager;
    }
}
