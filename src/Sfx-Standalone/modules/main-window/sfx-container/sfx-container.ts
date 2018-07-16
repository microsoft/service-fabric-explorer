
//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as $ from "jquery";
import * as appUtils from "../../../utilities/appUtils";
import * as uuidv5 from "uuid/v5";
import { WebviewTag } from "electron";
import { electron } from "../../../utilities/electron-adapter";
import { IComponentInfo } from "sfx.module-manager";
import { ISfxContainer } from "sfx.sfx-view-container";

export class SfxContainer implements ISfxContainer {
    static UrlUuidNameSpace: string = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";
    endpoints: any[] = [];

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
        const container = $("div.right-container");
        $(".view-container", container).hide();

        const id = uuidv5(targetServiceEndpoint, SfxContainer.UrlUuidNameSpace);

        if (!this.endpoints.find(e => e.endpoint === targetServiceEndpoint)) {
            this.endpoints.push({ endpoint: targetServiceEndpoint, id: id});

            const sfxUrl = appUtils.resolve({ path: "../../../sfx/index.html", search: "?targetcluster=" + targetServiceEndpoint});
            $(`<div id="view-container-${id}" class="view-container"><webview id="view-${id}" src="${sfxUrl}" nodeintegration preload="./preload.js"></webview></div>`).appendTo(container);
        } else {            
            $(`#view-container-${id}`, container).show();
        }
        
        const sfxWebView = <WebviewTag>document.getElementById(`view-${id}`);
        
        sfxWebView.addEventListener("dom-ready", async () => {
            if (!sfxWebView.isDevToolsOpened()) {
                sfxWebView.openDevTools();
            }  
        });

        return Promise.resolve();
    }
}
