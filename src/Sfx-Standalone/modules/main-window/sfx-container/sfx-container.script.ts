
//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { WebviewTag } from "electron";
import { electron } from "../../../utilities/electron-adapter";
import { IComponentInfo } from "sfx.module-manager";
import * as appUtils from "../../../utilities/appUtils";
import { ISfxContainer } from "./sfx-container";

export class SfxContainer implements ISfxContainer {
    public static getComponentInfo(): IComponentInfo {
        return {
            name: "page-sfx-container",
            version: electron.app.getVersion(),
            singleton: true,
            descriptor: () => new SfxContainer(),
            deps: []
        };
    }
    
    public async LoadSfxAsync(targetServiceEndpoint: string): Promise<void> {                
        const sfxWebView = <WebviewTag>document.getElementById("sfx-container");

        if (sfxWebView.isLoading()) {
            sfxWebView.stop();
        }
        
        sfxWebView.loadURL(appUtils.resolve({ path: "../../../sfx/index.html", search: "?targetcluster=" + targetServiceEndpoint}));        
        if (!sfxWebView.isDevToolsOpened()) {
            sfxWebView.openDevTools();
        }  

        return Promise.resolve();
    }
}
