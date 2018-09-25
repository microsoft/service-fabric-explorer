//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as $ from "jquery";
import { IComponentInfo } from "sfx.module-manager";
import { electron } from "../../../utilities/electron-adapter";
import { WebviewTag } from "electron";
import { IDialogService, IDialogRenderingOption } from "sfx.main-window";

// DialogService runs in main window
export class DialogService implements IDialogService {
    public onClose: () => Promise<void>;
    public onPost: (data: any) => Promise<void>;

    public static getComponentInfo(): IComponentInfo<DialogService> {
        return {
            name: "dialog-service",
            version: electron.app.getVersion(),
            singleton: true,
            descriptor: async () => new DialogService()
        };
    }

    async showDialogAsync(pageUrl: string): Promise<void> {
        const template = `
            <div id="main-modal-dialog" class="modal" role="dialog">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <webview src="${pageUrl}" preload="./preload.js" nodeintegration style="width=480px;"></webview>
                    </div>
                </div>
            </div>`;

        $(document.body).append($(template));

        let webview = <WebviewTag>document.querySelector(`#main-modal-dialog webview`);
        webview.addEventListener("dom-ready", async () => {
            //webview.openDevTools(); /*uncomment to use development tools*/
            await sfxModuleManager.newHostAsync("host-dialog-service", await sfxModuleManager.getComponentAsync("ipc.communicator", webview.getWebContents()));
        });

        webview.addEventListener("close", async () => {
            await sfxModuleManager.destroyHostAsync("host-dialog-service");
            $("#main-modal-dialog").modal("hide").remove();
        });

        $("#main-modal-dialog").modal();
    }

    async showInlineDialogAsync(options: IDialogRenderingOption): Promise<void> {
        if (!options.width) {
            options.width = 600;            
        }

        if (!options.height) {
            options.height = 600;            
        }

        const containerTemplate = `
            <div id="main-modal-dialog" class="modal" role="dialog">
                <div class="modal-dialog" role="document" style="width: ${options.width}px; height: ${options.height}px;">
                    <div class="modal-content">
                        <webview src="./dialog-service/dialog.html" preload="./preload.js" nodeintegration></webview>
                    </div>
                </div>
            </div>`;

        $(document.body).append($(containerTemplate));

        let webview = <WebviewTag>document.querySelector(`#main-modal-dialog webview`);
        webview.addEventListener("dom-ready", async () => {
            //webview.openDevTools(); /*uncomment to use development tools*/
            await sfxModuleManager.newHostAsync("host-dialog-service", await sfxModuleManager.getComponentAsync("ipc.communicator", webview.getWebContents()));

            const template = `                       
                <div class="modal-header">
                    <h4 class="modal-title">${options.title}</h4>
                </div>
                <div class="modal-body">
                    ${options.bodyHtml}
                </div>
                <div class="modal-footer">
                    ${options.footerHtml}
                </div>`.replace(/(?:\r\n|\r|\n)/g, "");

            webview.executeJavaScript(`$(".modal-content").append($('${template}'));`);
            webview.executeJavaScript(`require("${options.scriptPath}");`);
        });

        webview.addEventListener("close", async () => {
            await sfxModuleManager.destroyHostAsync("host-dialog-service");
            $("#main-modal-dialog").modal("hide").remove();
        });

        $("#main-modal-dialog").modal();
    }

    async closeInlineDialogAsync(): Promise<void> {
        $("#main-modal-dialog").modal("hide").remove();
        return Promise.resolve();
    }
}
