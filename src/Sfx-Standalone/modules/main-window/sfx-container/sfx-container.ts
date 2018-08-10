
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
    private endpoints: any[] = [];


    public static getComponentInfo(): IComponentInfo<SfxContainer> {
        return {
            name: "page-sfx-container",
            version: electron.app.getVersion(),
            singleton: true,
            descriptor: async () => new SfxContainer(),
            deps: []
        };
    }

   
    
    public async LoadSfxAsync(targetServiceEndpoint: string): Promise<void> {                
        const container = $("div.right-container");
        $(".view-container", container).hide();

        const id = uuidv5(targetServiceEndpoint, SfxContainer.UrlUuidNameSpace);

        if (!this.endpoints.find(e => e.endpoint === targetServiceEndpoint)) {
            this.endpoints.push({ endpoint: targetServiceEndpoint, id: id});
            
            container.append(`<div id="treeview-loading-glyph" class="bowtie-icon bowtie-spinner rotate"></div>`);
            const sfxUrl = appUtils.resolve({ path: "../../../sfx/index.html", search: "?targetcluster=" + targetServiceEndpoint});
            $(`<div id="view-container-${id}" class="view-container"><webview id="view-${id}" src="${sfxUrl}" nodeintegration preload="./preload.js"></webview></div>`).appendTo(container);
            
            

        } else {            
            $(`#view-container-${id}`, container).show();
            
           
        }
        
        const sfxWebView = <WebviewTag>document.getElementById(`view-${id}`);
        
        sfxWebView.addEventListener("dom-ready", async () => {
            container.children("#treeview-loading-glyph").remove();
            if (!sfxWebView.isDevToolsOpened()) {
                sfxWebView.openDevTools();
            }  
        });

        return Promise.resolve();
    }

    public async UnloadSfxAsync(targetServiceEndpoint: string): Promise<void> {
        const container = $("div.right-container");
        $(".view-container", container).hide();

        const id = uuidv5(targetServiceEndpoint, SfxContainer.UrlUuidNameSpace);
        
            // this.endpoints.push({ endpoint: targetServiceEndpoint, id: id});
            console.log(this.endpoints.indexOf(e => e.endpoint === targetServiceEndpoint));
            this.endpoints.splice(this.endpoints.indexOf(e => e.endpoint === targetServiceEndpoint), 1);

            //const sfxUrl = appUtils.resolve({ path: "../../../sfx/index.html", search: "?targetcluster=" + targetServiceEndpoint});
            //$(`<div id="view-container-${id}" class="view-container"><webview id="view-${id}" src="${sfxUrl}" nodeintegration preload="./preload.js"></webview></div>`).remove(container);
            container.children("#view-container-" + id).remove();
        


    }
}
