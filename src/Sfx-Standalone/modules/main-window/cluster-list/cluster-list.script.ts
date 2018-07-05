import * as $ from "jquery";
// import { ICommunicator, AsyncRequestHandler, IRoutePattern } from "sfx.remoting";
import { ipcRenderer, ipcMain } from "electron";
import { IMainWindow, IComponent } from "sfx.main-window";
import { SfxContainer } from "../sfx-container/sfx-container.script";
import { electron } from "../../../utilities/electron-adapter";
import { IComponentInfo } from "sfx.module-manager";

(async () => {

    sfxModuleManager.registerComponents([ ClusterList.getComponentInfo() ]);

    console.log("cluster-list loaded");

    try {
        sfxModuleManager.getComponentAsync("ipc.communicator", ipcRenderer).then(c => console.log("comm", c));
        //console.log("communicator", await sfxModuleManager.getComponentAsync("ipc.communicator", ipcRenderer));
    } catch (error) {
        console.log(error);
    }

    try {
        const $button = $("button#c-cluster-list-button");
        const communicator = global["communicator"];
        console.log(communicator);

        $button.click(() => {
            console.log("button clicked");
            // TODO: refresh sfxContainer here


            //communicator.sendAsync("//index-window/components/cluster-list-button.click", { name: "cluster-list-button-click", endpoint: $button.data("endpoint") });
        });
    } catch (error) {
        console.log(error);
    }
})();

export class ClusterList implements IComponent {

    public static getComponentInfo(): IComponentInfo {
        return {
            name: "cluster-list",
            version: electron.app.getVersion(),
            singleton: true,
            descriptor: () => new ClusterList(),
            deps: []

        };
    }

    handleButtonClickAsync(button: HTMLElement): Promise<void> {
        throw new Error("Method not implemented.");
    }
}
