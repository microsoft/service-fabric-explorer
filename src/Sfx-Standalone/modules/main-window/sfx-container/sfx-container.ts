
//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as $ from "jquery";
import * as appUtils from "../../../utilities/appUtils";
import * as uuidv5 from "uuid/v5";
//import * as url from "url";
import { WebviewTag } from "electron";
import { electron } from "../../../utilities/electron-adapter";
import { IComponentInfo } from "sfx.module-manager";
import { ISfxContainer } from "sfx.sfx-view-container";
//import { IDictionary } from "sfx.common";

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

    public async reloadSfxAsync(targetServiceEndpoint: string): Promise<void> {
        const container = $("div.right-container");
        $("#instructions", container).hide();
        $(".view-container", container).hide();

        const id = uuidv5(targetServiceEndpoint, SfxContainer.UrlUuidNameSpace);
        const sfxWebView = <WebviewTag>document.getElementById(`view-${id}`);
        if (sfxWebView) {
            //await sfxModuleManager.destroyHostAsync(`host-sfx-${id}`);
            sfxWebView.reload();
            $(`#view-container-${id}`, container).show();
        }

        return Promise.resolve();
    }

    public async loadSfxAsync(targetServiceEndpoint: string): Promise<void> {
        const container = $("div.right-container");
        $("#instructions", container).hide();
        $(".view-container", container).css({ top: `${0 - container.height()}px` }).removeClass("current");

        const id = uuidv5(targetServiceEndpoint, SfxContainer.UrlUuidNameSpace);

        if (this.endpoints.find(e => e.endpoint === targetServiceEndpoint)) {
            $(`#view-container-${id}`, container).css({ top: 0 }).addClass("current");
            return Promise.resolve();
        }

        const log = await sfxModuleManager.getComponentAsync("logging");
        const sfxUrl = appUtils.resolve({ path: "../../../sfx/index.html", search: "?targetcluster=" + targetServiceEndpoint });
        this.endpoints.push({ endpoint: targetServiceEndpoint, id: id });
        container.append(`<div id="treeview-loading-glyph" class="bowtie-icon bowtie-spinner rotate"></div>`);
        $(`<div id="view-container-${id}" class="view-container current"><webview tabindex="0" src="${sfxUrl}" id="view-${id}" autosize="on" nodeintegration preload="./preload.js"></webview></div>`).appendTo(container);

        const sfxWebView = <WebviewTag>document.getElementById(`view-${id}`);
        sfxWebView.addEventListener("dom-ready", async () => {
            //await sfxModuleManager.newHostAsync(`host-sfx-${id}`, await sfxModuleManager.getComponentAsync("ipc.communicator", sfxWebView.getWebContents()));
            log.writeInfoAsync("dom-ready --- ");

            if (!sfxWebView.isDevToolsOpened()) {
                sfxWebView.openDevTools(); /*uncomment to use development tools */
            }

            container.children("#treeview-loading-glyph").remove();
            sfxWebView.executeJavaScript(" angular.bootstrap(document, [Sfx.Constants.sfxAppName], { strictDi: true });");
        });

        return Promise.resolve();
    }

    public async unloadSfxAsync(targetServiceEndpoint: string): Promise<void> {
        const container = $("div.right-container");
        const id = uuidv5(targetServiceEndpoint, SfxContainer.UrlUuidNameSpace);
        const index = this.endpoints.findIndex(e => e.endpoint === targetServiceEndpoint);
        if (index >= 0) {
            this.endpoints.splice(index, 1);
        }
                
        container.children("#view-container-" + id).remove();
        
        if (this.endpoints.length === 0) {
            $("#instructions", container).show();
        }

        //await sfxModuleManager.destroyHostAsync(`host-sfx-${id}`);
    }
}

$(window).on("resize", () => {
    // Bug from Electron: when <webview> is hidden, its webcontents won't auto resize to fill the whole view when window is resizing
    // Instead of hiding the <webview> tags which are not current, pushing it out of view so it always fills the whole view
    const container = $("div.right-container");    
    $(".view-container:not(.current)", container).css({ top: `${0 - container.height()}px` });    
});
