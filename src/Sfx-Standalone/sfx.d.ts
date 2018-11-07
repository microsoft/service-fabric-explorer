//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

/// <reference path="./node_modules/donuts.node/index.d.ts" />
/// <reference path="./node_modules/donuts.node-settings/index.d.ts" />
/// <reference path="./node_modules/donuts.node-remote/index.d.ts" />
/// <reference path="./node_modules/donuts.node-modularity/index.d.ts" />

/// <reference path="./common.d.ts" />

/// <reference path="./modules/update/update.d.ts" />
/// <reference path="./modules/http/http.d.ts" />
/// <reference path="./modules/http/http.d.ts" />
/// <reference path="./modules/cert/cert.d.ts" />
/// <reference path="./modules/browser-window/browser-window.d.ts" />
/// <reference path="./modules/prompt/prompt.d.ts" />
/// <reference path="./modules/prompt.input/prompt.input.d.ts" />
/// <reference path="./modules/prompt.select-certificate/prompt.select-certificate.d.ts" />
/// <reference path="./modules/prompt.connect-cluster/prompt.connect-cluster.d.ts" />

declare module "sfx" {
    import { ISfxModuleManager } from "sfx.module-manager";

    global {
        const sfxModuleManager: ISfxModuleManager;

        interface Error {
            toJSON?(): any;
        }
    }
}
