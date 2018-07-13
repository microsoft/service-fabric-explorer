//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as $ from "jquery";
import { IComponentInfo } from "sfx.module-manager";
import { electron } from "../../utilities/electron-adapter";
import { WebviewTag } from "electron";
import { ICommunicator } from "sfx.remoting";

export class DialogService {
    public static getComponentInfo(): IComponentInfo {
        return {
            name: "dialog-service",
            version: electron.app.getVersion(),
            singleton: true,
            descriptor: () => new DialogService()
        };
    }

    ShowDialog(pageUrl: string): void {
        const template = `
            <div id="main-modal-dialog" class="modal" tabindex="-1" role="dialog">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <webview src="${pageUrl}" preload="./preload.js" nodeintegration></webview>
                    </div>
                </div>
            </div>`;

        $(document.body).append($(template));

        let webview = <WebviewTag>document.querySelector(`#main-modal-dialog webview`);
        webview.addEventListener("dom-ready", async () => {
            //webview.openDevTools();
            await sfxModuleManager.newHostAsync("host-dialog-service", await sfxModuleManager.getComponentAsync<ICommunicator>("ipc.communicator", webview.getWebContents()));
        });

        webview.addEventListener("close", async () => {            
            await sfxModuleManager.destroyHostAsync("host-dialog-service");
            $("#main-modal-dialog").modal("hide").remove();
        });

        $("#main-modal-dialog").modal();
    }
}
