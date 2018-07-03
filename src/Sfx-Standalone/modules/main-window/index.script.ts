import * as $ from "jquery";
import { ICommunicator, AsyncRequestHandler, IRoutePattern }  from "sfx.remoting";
import { ipcRenderer, ipcMain, WebviewTag } from "electron";
import { IMainWindow, ISfxComponent } from "sfx.main-window";

(async () => {
    try {
        const leftpanel = $("div#leftpanel");
        const communicator = <ICommunicator>await sfxModuleManager.getComponentAsync("ipc.communicator", ipcRenderer);
        const pattern = await sfxModuleManager.getComponentAsync("remoting.pattern.string", "//index-window");
        const onConfigurationReceived = async (communicator: ICommunicator, path: string, msg: ISfxComponent[]): Promise<any> => {            
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

                    webview.addEventListener("ipc-message", event => {});
                }
            });

            return Promise.resolve();
        };
        
        communicator.map(pattern, onConfigurationReceived);

    } catch (error) {
        console.log(error);
    }
})();
