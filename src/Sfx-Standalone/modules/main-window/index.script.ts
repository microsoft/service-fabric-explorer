import * as $ from "jquery";
import { ICommunicator, AsyncRequestHandler, IRoutePattern } from "sfx.remoting";
import { ipcRenderer, ipcMain, WebviewTag } from "electron";
import { IMainWindow, IComponentConfiguration } from "sfx.main-window";
import { SfxContainer } from "./sfx-container/sfx-container.script";
import { DialogService } from "./index.page";
import { LocalSfxVueComponent } from "./main-window";

(async () => {    

    sfxModuleManager.registerComponents([DialogService.getComponentInfo()]);

    const leftpanel = $("div#left-panel");

    // TODO: load component list from setting service
    const components: IComponentConfiguration[] = [new LocalSfxVueComponent()];

    try {
        await Promise.all(components.map(async component => {
            const template = $(`<div><button class="btn btn-primary btn-component" id="c-button-${component.id}" data-component="${component.id}">${component.title}</button></div>`);
            leftpanel.append(template);

            if (component.viewUrl) {
                $(`<div id="sub-${component.id}"><webview id="wv-${component.id}" src="${component.viewUrl}" nodeintegration preload="./cluster-list/preload.js"></webview></div>`).appendTo(template);

                let webview = <WebviewTag>document.querySelector(`webview[id='wv-${component.id}']`);

                console.log(webview);

                webview.addEventListener("dom-ready", async () => {
                    webview.openDevTools();
                    await sfxModuleManager.newHostAsync(`host-${component.id}`, await sfxModuleManager.getComponentAsync<ICommunicator>("ipc.communicator", webview.getWebContents()));
                });

                console.log("index.script done");
            }

            $(".btn-component").click(() => {

            });
        }));
    } catch (error) {
        console.log(error);
    }
})();

