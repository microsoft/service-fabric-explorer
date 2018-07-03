import * as $ from "jquery";
// import { ICommunicator, AsyncRequestHandler, IRoutePattern } from "sfx.remoting";
// import { ipcRenderer, ipcMain } from "electron";
// import { IMainWindow, ISfxComponent } from "sfx.main-window";

(async () => {
    console.log("cluster-list loaded");

    try {
        const $button = $("button#c-cluster-list-button");
        const c = global["communicator"];
        console.log(c);
        
        $button.click(() => {
            console.log("button clicked");
            c.sendAsync("//index-window/components/cluster-list-button.click", { name: "cluster-list-button-click", endpoint: $button.data("endpoint") });
        });
    } catch (error) {
        console.log(error);
    }
})();
