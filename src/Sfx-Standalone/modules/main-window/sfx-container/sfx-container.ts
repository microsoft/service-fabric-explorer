
//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as $ from "jquery";
import * as authCert from "../../../utilities/auth/cert";
import * as authAad from "../../../utilities/auth/aad";
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

    public async loadSfxAsync(targetServiceEndpoint: string): Promise<void> {
        const container = $("div.right-container");
        $("#instructions", container).hide();
        $(".view-container", container).hide();

        const id = uuidv5(targetServiceEndpoint, SfxContainer.UrlUuidNameSpace);

        if (!this.endpoints.find(e => e.endpoint === targetServiceEndpoint)) {
            this.endpoints.push({ endpoint: targetServiceEndpoint, id: id });

            container.append(`<div id="treeview-loading-glyph" class="bowtie-icon bowtie-spinner rotate"></div>`);
            $(`<div id="view-container-${id}" class="view-container"><webview tabindex="0" id="view-${id}" nodeintegration preload="./preload.js"></webview></div>`).appendTo(container);
        } else {
            $(`#view-container-${id}`, container).show();
            return;
        }

        const log = await sfxModuleManager.getComponentAsync("logging");
        const sfxUrl = appUtils.resolve({ path: "../../../sfx/index.html", search: "?targetcluster=" + targetServiceEndpoint });
        const sfxWebView = <WebviewTag>document.getElementById(`view-${id}`);

        sfxWebView.addEventListener("dom-ready", async () => {
            log.writeInfoAsync("dom-ready --- ");

            container.children("#treeview-loading-glyph").remove();

            if (!sfxWebView.isDevToolsOpened()) {
                sfxWebView.openDevTools(); /*uncomment to use development tools */
            }
        });

        this.handleSslCert(sfxWebView);
        authAad.handle(sfxWebView, targetServiceEndpoint);
        authCert.handle(sfxModuleManager, sfxWebView);

        sfxWebView.loadURL(sfxUrl);

        return Promise.resolve();
    }

    public async unloadSfxAsync(targetServiceEndpoint: string): Promise<void> {
        const container = $("div.right-container");
        //$(".view-container", container).hide();

        const id = uuidv5(targetServiceEndpoint, SfxContainer.UrlUuidNameSpace);
        this.endpoints.splice(this.endpoints.indexOf(e => e.endpoint === targetServiceEndpoint), 1);
        container.children("#view-container-" + id).remove();

        if (this.endpoints.length === 0) {
            $("#instructions", container).show();
        }
    }

    private handleSslCert(webview: WebviewTag): void {
        //const trustedCertManager: IDictionary<boolean> = Object.create(null);
        //const hostingWindow = await sfxModuleManager.getComponentAsync("browser-window");
        //const log = await sfxModuleManager.getComponentAsync("logging");
        const webContents = webview.getWebContents();
        webContents.on("certificate-error", (event, url, error, certificate, callback) => {
            console.log("certificate-error", url, error, callback);
            event.preventDefault();
            callback(true);           
        });
    }
}
