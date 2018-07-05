import * as $ from "jquery";
import { ICommunicator, AsyncRequestHandler, IRoutePattern }  from "sfx.remoting";
import { ipcRenderer, ipcMain, WebviewTag } from "electron";
import { IMainWindow, IComponentConfiguration } from "sfx.main-window";
import { SfxContainer } from "./sfx-container/sfx-container.script";

(async () => {
    try {

        

        const leftpanel = $("div#leftpanel");
        const communicator = <ICommunicator>await sfxModuleManager.getComponentAsync("ipc.communicator", ipcRenderer);
        const pattern = await sfxModuleManager.getComponentAsync("remoting.pattern.string", "//index-window");

        const onConfigurationReceived = async (communicator: ICommunicator, path: string, msg: IComponentConfiguration[]): Promise<any> => {            
            console.log(msg[0]);    

            msg.forEach(component => {
                const template = $(`<div><button>${component.title}</button></div>`);
    
                if (component.viewUrl) {
                    $(`<webview src="${component.viewUrl}" nodeintegration preload="./cluster-list/preload.js"></webview>`).appendTo(template);
                }
    
                leftpanel.append(template);

                const webview = <WebviewTag>document.querySelector("webview");

                console.log(webview);
                    
                if (webview) {
                    webview.addEventListener("dom-ready", () => {
                        webview.openDevTools();
                    });
                }
            });

            return Promise.resolve();
        };
        
        communicator.map(pattern, onConfigurationReceived);

    } catch (error) {
        console.log(error);
    }
})();
