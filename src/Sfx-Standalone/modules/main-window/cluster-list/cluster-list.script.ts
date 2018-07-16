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

export class ClusterList implements IClusterList {

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

    async newListItemAsync(endpoint: string, name?: string): Promise<void> {
        $("#cluster-list .btn-success").removeClass("btn-success");

        if (!name) {
            name = endpoint;
        }

        if (!this.endpoints.find(e => e === endpoint)) {
            this.endpoints.push(endpoint);
                       
            const $item = $(`<li><button class="btn btn-success btn-cluster" data-endpoint="${endpoint}">${name}</button></li>`);
            $("#cluster-list").append($item);
        
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

        return Promise.resolve();
    }
}

(async () => {
    sfxModuleManager.registerComponents([ClusterList.getComponentInfo()]);

    const clusterListComponent = await sfxModuleManager.getComponentAsync<ClusterList>("cluster-list");

    await clusterListComponent.setupAsync();
})();
