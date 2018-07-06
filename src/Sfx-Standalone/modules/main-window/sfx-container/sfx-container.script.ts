
import * as $ from "jquery";
// import { ICommunicator, AsyncRequestHandler, IRoutePattern } from "sfx.remoting";
import { ipcRenderer, ipcMain, WebviewTag } from "electron";
import { IModuleInfo } from "sfx.module-manager";
import { electron } from "../../../utilities/electron-adapter";
import { IComponentInfo } from "sfx.module-manager";

export class SfxContainer {
    public static getComponentInfo(): IComponentInfo {
        return {
            name: "page-sfx-container",
            version: electron.app.getVersion(),
            singleton: true,
            descriptor: () => new SfxContainer(),
            deps: []

        };
    }
    
    public LoadSfx(targetServiceEndpoint: string): void {
        const sfxWebView = <WebviewTag>document.getElementById("sfx-container");

        if (sfxWebView.isLoading()) {
            sfxWebView.stop();
        }

        sfxWebView.loadURL("../../../sfx/index.html");
    }
}
