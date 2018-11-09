//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as $ from "jquery";
import { electron } from "../../../utilities/electron-adapter";
import { WebviewTag } from "electron";
import { IDialogService, IDialogRenderingOption } from "sfx.main-window";

// DialogService runs in main window
export class DialogService implements IDialogService {
    public onClose: () => Promise<void>;
    public onPost: (data: any) => Promise<void>;

    public static getComponentInfo(): Donuts.Modularity.IComponentInfo<DialogService> {
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
            //await sfxModuleManager.newHostAsync("host-dialog-service", await sfxModuleManager.getComponentAsync("ipc.communicator", webview.getWebContents()));
        });

        webview.addEventListener("close", async () => {
            //await sfxModuleManager.destroyHostAsync("host-dialog-service");
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

        console.log("appending to doc", Date.now());
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

        $(".modal-content").html(template);
        $("#main-modal-dialog").modal();

        return Promise.resolve();
    }

    async closeInlineDialogAsync(): Promise<void> {
        $("#main-modal-dialog").modal("hide").remove();
        return Promise.resolve();
    }
}
