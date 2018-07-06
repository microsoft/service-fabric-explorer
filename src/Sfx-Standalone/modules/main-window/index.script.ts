import * as $ from "jquery";
import { ICommunicator, AsyncRequestHandler, IRoutePattern } from "sfx.remoting";
import { ipcRenderer, ipcMain, WebviewTag } from "electron";
import { IMainWindow, IComponentConfiguration } from "sfx.main-window";
import { SfxContainer } from "./sfx-container/sfx-container.script";

(async () => {
    try {

        const leftpanel = $("div#left-panel");
        const communicator = await sfxModuleManager.getComponentAsync<ICommunicator>("ipc.communicator", ipcRenderer);
        const pattern = await sfxModuleManager.getComponentAsync("remoting.pattern.string", "//index-window");

        const onConfigurationReceived = async (communicator: ICommunicator, path: string, msg: IComponentConfiguration[]): Promise<any> => {
            console.log(msg[0]);

            await Promise.all(msg.map(async component => {
                const template = $(`<div><button class="btn btn-primary" id="c-button-${component.id}">${component.title}</button></div>`);
                leftpanel.append(template);

                if (component.viewUrl) {
                    $(`<webview id="wv-${component.id}" src="${component.viewUrl}" nodeintegration preload="./cluster-list/preload.js"></webview>`).appendTo(template);

                    let webview = <WebviewTag>document.querySelector(`webview[id='wv-${component.id}']`);

                    console.log(webview);

                    webview.addEventListener("dom-ready", () => {
                        webview.openDevTools();
                    });

                    await sfxModuleManager.newHostAsync(`host-${component.id}`, await sfxModuleManager.getComponentAsync<ICommunicator>("ipc.communicator", webview.getWebContents()));
                    console.log("index.script done");
                }
            }));
        };

        communicator.map(pattern, onConfigurationReceived);

    } catch (error) {
        console.log(error);
    }
})();
