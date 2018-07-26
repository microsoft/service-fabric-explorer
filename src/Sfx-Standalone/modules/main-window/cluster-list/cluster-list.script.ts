//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as $ from "jquery";
import { electron } from "../../../utilities/electron-adapter";
import { IComponentInfo } from "sfx.module-manager";
import { IClusterList } from "sfx.cluster-list";
import { ISfxContainer } from "sfx.sfx-view-container";
import { IDialogService } from "sfx.main-window";
import { Menu } from "./Model"


export class ClusterList implements IClusterList {
    menu: Menu = Menu.getInstance();
    endpoints: string[] = [];

    public static getComponentInfo(): IComponentInfo {
        return {
            name: "cluster-list",
            version: electron.app.getVersion(),
            singleton: true,
            descriptor: async () => new ClusterList(),
            deps: []
        };
    }

    async newFolderItemAsync(label: string): Promise<void> {
        const $item = $(`<li>${label} <ul class="folder ${label}"></ul></li>`);
        $("#cluster-list").append($item);
        this.menu.addFolder(label);

        return Promise.resolve();
    }

    async newListItemAsync(endpoint: string, name?: string): Promise<void> {
        $("#cluster-list .btn-success").removeClass("btn-success");

        if (!name) {
            name = endpoint;
        }

        if (!this.endpoints.find(e => e === endpoint)) {
            this.endpoints.push(endpoint);
                       
            const $item = $(`<li class="btn btn-success btn-cluster" data-endpoint="${endpoint}">${name}</li>`);
            $("#cluster-list").append($item);
        
            //this method waits for the the button to be clicked so changes to the 
            $(".btn-cluster", $item).click(async (e) => {
                const $button = $(e.target);

                if ($button.hasClass("btn-success")) {
                    return;
                }

                await (await sfxModuleManager.getComponentAsync<ISfxContainer>("page-sfx-container")).LoadSfxAsync($button.data("endpoint"));

                $("#cluster-list .btn-success").removeClass("btn-success");
                $button.addClass("btn-success");
            });
        } else {            
            $(`#cluster-list button[data-endpoint='${endpoint}']`).addClass("btn-success");
        }

        return Promise.resolve();
    }

    async setupAsync(): Promise<void> {
        $("#cluster-list-connect").click(async () => {
            (await sfxModuleManager.getComponentAsync<IDialogService>("dialog-service")).showDialogAsync("./cluster-list/connect-cluster.html");
        });
        $("#cluster-list-folder").click(async() => {
            (await sfxModuleManager.getComponentAsync<IDialogService>("dialog-service")).showDialogAsync("./cluster-list/folder.html");
        });

        return Promise.resolve();
    }
    
}

(async () => {
    sfxModuleManager.registerComponents([ClusterList.getComponentInfo()]);

    const clusterListComponent = await sfxModuleManager.getComponentAsync<ClusterList>("cluster-list");

    await clusterListComponent.setupAsync();
})();




