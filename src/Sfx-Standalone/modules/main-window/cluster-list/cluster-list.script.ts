//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as $ from "jquery";
import { electron } from "../../../utilities/electron-adapter";
import { IComponentInfo } from "sfx.module-manager";
import { IClusterList, IClusterListDataModel } from "sfx.cluster-list";
import { ISfxContainer } from "sfx.sfx-view-container";
import { IDialogService } from "sfx.main-window";
import { ClusterListDataModel } from "./model";
import { ISettings } from "sfx.settings";

export class ClusterList implements IClusterList {
    private clusterListDataModel: ClusterListDataModel;
    private endpoints: string[] = [];
    private settings: ISettings;

    public static getComponentInfo(): IComponentInfo<ClusterList> {
        return {
            name: "cluster-list",
            version: electron.app.getVersion(),
            singleton: true,
            descriptor: async (settings: ISettings) => new ClusterList(settings),
            deps: ["settings"]
        };
    }

    constructor(settings: ISettings) {
        this.settings = settings;
        this.parseSettings();
    }

    public async getDataModel(): Promise<IClusterListDataModel> {
        return Promise.resolve(this.clusterListDataModel);
    }

    async newFolderItemAsync(name: string): Promise<void> {
        if (this.clusterListDataModel.getFolder(name)) {
            throw new Error("This folder already exists!");
        } else if (!name) {
            throw new Error("Please enter a folder name!");
        }
        const $item = $(
            `<li data-name="${name}">
                <div class="folder list-item"><img src="../../../icons/Closedfolder.svg" style="width: 16px; height: 16px;"><span>${name}</span>
                    <a role="button" class="bowtie-icon bowtie-ellipsis"></a>
                </div>
                <ul role="menu" class="dropdown-menu" uib-dropdown-menu style="list-style: none">
                    <li role="menuitem">
                        <a role="menuitem" href="#">Remove Folder</a>
                    </li>
                </ul>
                <ul id="folder-${name.replace(/\s+/g, "")}""></ul>
            </li>`);

        $("#cluster-list-organized").append($item);
        this.clusterListDataModel.addFolder(name);
        await this.settings.setAsync<string>("cluster-list-folders", JSON.stringify(this.clusterListDataModel));
        this.setupFolderItemHandler($item, name);
        return Promise.resolve();
    }

    async newClusterListItemAsync(endpoint: string, displayName?: string, folder?: string, isCurrentInView: boolean = false): Promise<void> {
        $("#cluster-list .current").removeClass("current");
        if (!displayName) {
            displayName = endpoint;
        }

        if (this.clusterListDataModel.getCluster(endpoint, "endpoint") !== null) {            
            return;
        }

        if (this.endpoints.find(e => e === endpoint)) {
            $(`#cluster-list li[data-endpoint='${endpoint}']`).addClass("current");
        } else {
            this.endpoints.push(endpoint);
            if (this.clusterListDataModel.getFolder(folder) === null) {
                this.newFolderItemAsync(folder);
            }

            let folderElementId: string = "#folder-" + folder.replace(/\s+/g, "");
            if (folder === "") {
                folderElementId = "#cluster-list";
            }

            const $item = $(`
                <li tabindex="0" class="cluster list-item" data-endpoint="${endpoint}">
                    <img src="../../../icons/icon16x16.png"><span>${displayName}</span>
                    <button tabindex="0" class="bowtie-icon bowtie-ellipsis"></button>
                    <ul role="menu" class="dropdown-menu" uib-dropdown-menu>
                        <li role="menuitem"><a class="cluster-action" role="menuitem" href="#" data-action="remove">Remove Cluster</a></li>
                        <li role="menuitem"><a class="cluster-action" role="menuitem" href="#" data-action="rename">Rename Cluster</a></li>
                        <li role="menuitem"><a class="cluster-action" role="menuitem" href="#" data-action="move">Move Cluster</a></li>
                    </ul>
                </li>`);

            $(folderElementId).append($item);

            if (isCurrentInView) {
                $item.addClass("current");
            }
            
            this.clusterListDataModel.addCluster(displayName, endpoint, folder);
            await this.settings.setAsync<string>("cluster-list-folders", JSON.stringify(this.clusterListDataModel));
            this.setupClusterListItemHandler($item, endpoint, displayName);
        }

        return Promise.resolve();
    }

    async removeClusterListItem(cluster_label: string): Promise<void> {
        let endpoint = this.clusterListDataModel.getCluster(cluster_label, "label");

        let $button = $('#cluster-list li[data-endpoint="' + endpoint.endpoint + '"]');
        if ($button.hasClass("current")) {
            await (await sfxModuleManager.getComponentAsync<ISfxContainer>("page-sfx-container")).unloadSfxAsync(endpoint.endpoint);
            $button.removeClass("current");
        }
        $button.remove();
        this.endpoints.splice(this.endpoints.indexOf(endpoint.endpoint), 1);
        this.clusterListDataModel.removeCluster(cluster_label, endpoint.folder);
        await this.settings.setAsync<string>("cluster-list-folders", JSON.stringify(this.clusterListDataModel));
    }

    async renameClusterListItem(cluster_label: string, new_cluster: string): Promise<any> {
        if (cluster_label === new_cluster) {
            return;
        } else if (this.clusterListDataModel.getCluster(new_cluster, "label")) {
            throw new Error("Clusters must have unique labels. Please enter a new name");
        }
        let endpoint = this.clusterListDataModel.getCluster(cluster_label, "label");
        let $button = $('#cluster-list li[data-endpoint="' + endpoint.endpoint + '"]');
        $button.find("span")[0].innerHTML = new_cluster;
        this.clusterListDataModel.renameCluster(cluster_label, new_cluster);
        await this.settings.setAsync<string>("cluster-list-folders", JSON.stringify(this.clusterListDataModel));

        return new_cluster;
    }

    async moveClusterListItem(clusterName: string, targetFolderName: string): Promise<void> {
        let endpoint = this.clusterListDataModel.getCluster(clusterName, "label");
        let $clusterListItem = $('#cluster-list li[data-endpoint="' + endpoint.endpoint + '"]');

        let folderElementId: string = "#folder-" + targetFolderName.replace(/\s+/g, "");
        if (targetFolderName === "") {
            folderElementId = "#cluster-list";
        }

        $(folderElementId).append($clusterListItem.clone(true, true));
        $clusterListItem.remove();
        this.clusterListDataModel.moveCluster(clusterName, targetFolderName);
        await this.settings.setAsync<string>("cluster-list-folders", JSON.stringify(this.clusterListDataModel));
    }

    async removeFolder(name: string): Promise<void> {
        const $item = $(`#cluster-list li[data-name="${name}"]`);
        if ($item.find(".current").length !== 0) {            
            $(".current").removeClass("current");
        }

        const clusters = this.clusterListDataModel.getFolder(name).clusters;
        const sfxContainer = await sfxModuleManager.getComponentAsync<ISfxContainer>("page-sfx-container");
        for (let cluster of clusters) {
            this.endpoints.splice(this.endpoints.indexOf(cluster.endpoint), 1);
            await sfxContainer.unloadSfxAsync(cluster.endpoint);
        }

        $item.remove();
        this.clusterListDataModel.removeFolder(name);
        await this.settings.setAsync<string>("cluster-list-folders", JSON.stringify(this.clusterListDataModel));
    }

    async setupAsync(): Promise<void> {
        $("#cluster-list-connect").click(async () => {
            localStorage.setItem("folders", JSON.stringify(this.clusterListDataModel.getFolders()));
            const dialogService = (await sfxModuleManager.getComponentAsync<IDialogService>("dialog-service"));
            dialogService.showInlineDialogAsync(
                "Connect to a cluster",
                `<p>Cluster URL</p>
                <input id="input-cluster-url" type="text" class = "input-flat" value=""/>
                <div class="checkbox-container">
                    <label for="input-connect-locally">
                        <input id="input-connect-locally" type="checkbox" /><label></label>Connect to localhost
                    </label>
                </div> <br>
                <p>Friendly Name (Optional)</p>
                <input id="input-cluster-label" type="text" class="input-flat" value="" /><br><br>
                <p>Choose a folder (optional)</p>
                <select id="input-select-folder" class="input-flat"></select> <br>
                <div id="new_folder" style="visibility: hidden;">Enter Folder Name: <input id="new-folder-label" type="text" class="input-flat" value=""/> </div>`,
                `<button id="btn-connect" type="submit" class="btn btn-primary">Connect</button>
                <button type="button" class="btn btn-default" id="btn-exit">Cancel</button>`,
                "../cluster-list/cluster-functionalities/connect-cluster.script.js");

        });

        $("#cluster-list-folder").click(async () => {
            (await sfxModuleManager.getComponentAsync<IDialogService>("dialog-service")).showDialogAsync("./cluster-list/folder-functionalities/folder.html");
        });

        return Promise.resolve();
    }

    private async parseSettings() {
        this.settings.getAsync<string>("cluster-list-folders").then(async res => {
            this.clusterListDataModel = new ClusterListDataModel();
            if (res === undefined || res === null) {
                await this.settings.setAsync<string>("cluster-list-folders", JSON.stringify(this.clusterListDataModel));
            } else {
                let json = JSON.parse(res);                
                for (let folder of json.folders) {
                    if (folder.name !== "") {
                        await this.newFolderItemAsync(folder.name);
                    }

                    for (let cluster of folder.clusters) {                        
                        await this.newClusterListItemAsync(cluster.endpoint, cluster.displayName, cluster.folder);
                    }
                }
            }
        });
    }

    private async setupFolderItemHandler($item, name: string) {
        $($item).click(async (e) => {
            let $eventTarget = $(e.target);

            //This handles if the ellipses is clicked
            if ($eventTarget.parent().hasClass("folder")) {
                if ($eventTarget.attr("class") === "bowtie-icon bowtie-ellipsis") {

                    if ($eventTarget.parent().next().hasClass("dropdown-menu-show")) {
                        $eventTarget.parent().next().removeClass("dropdown-menu-show");
                    } else {
                        $(".dropdown-menu-show").removeClass("dropdown-menu-show");
                        $eventTarget.parent().next().addClass("dropdown-menu-show");
                    }

                    $(document).mouseup((e) => {
                        let container = $(".dropdown-menu-show");
                        if (!container.is(e.target) && container.has(e.target).length === 0) {
                            $(".dropdown-menu-show").removeClass("dropdown-menu-show");
                        }
                    });

                    return;
                }
            } else if ($eventTarget.parent().parent().hasClass("dropdown-menu")) {
                //This handles if a menu-item in the dropdown-menu is clicked
                localStorage.setItem("folder", name);
                if ($eventTarget.attr("role") === "menuitem") {
                    if ($eventTarget.html().toString().trim() === "Remove Folder") {
                        (await sfxModuleManager.getComponentAsync<IDialogService>("dialog-service")).showInlineDialogAsync(
                            `Remove folder`,
                            `<p>Are you sure you want to remove folder ${name} and all cluster connections under it?</p>`,
                            `<button id="btn-delete-folder" type="submit" class="btn btn-primary" data-target="${name}">Remove</button><button id="btn-exit" type="button" class="btn btn-default">Cancel</button>`,
                            "../cluster-list/folder-functionalities/delete-folder.script.js");
                    }
                }
                
                return;
            }
        });
    }

    private async setupClusterListItemHandler($item, endpoint: string, name: string) {
        $("button.bowtie-icon", $item).click(async (e) => {
            e.stopPropagation();

            if ($(e.target).next().hasClass("dropdown-menu-show")) {
                $(e.target).next().removeClass("dropdown-menu-show");
            } else {
                $(".dropdown-menu-show").removeClass("dropdown-menu-show");
                $(e.target).next().addClass("dropdown-menu-show");
            }

            $(document).mouseup((e) => {
                let container = $(".dropdown-menu-show");
                if (!container.is(e.target) && container.has(e.target).length === 0) {
                    $(".dropdown-menu-show").removeClass("dropdown-menu-show");
                }
            });
        });

        $("a.cluster-action", $item).click(async (e) => {
            e.stopPropagation();

            $(".dropdown-menu-show").removeClass("dropdown-menu-show");
            if (this.clusterListDataModel.getCluster(endpoint, "endpoint").displayName !== name) {
                name = this.clusterListDataModel.getCluster(endpoint, "endpoint").displayName;
            }

            const action = $(e.target).data("action");
            switch (action) {
                case "remove":
                    (await sfxModuleManager.getComponentAsync<IDialogService>("dialog-service")).showInlineDialogAsync(
                        `Remove cluster`,
                        `<p>Are you sure you want to remove ${name}?</p>`,
                        `<button id="btn-delete-cluster" data-target="${name}" type="submit" class="btn btn-primary">Remove</button><button id="btn-exit" type="button" class="btn btn-default">Cancel</button>`,
                        "../cluster-list/cluster-functionalities/delete-cluster.script.js");
                    break;

                case "rename":
                    (await sfxModuleManager.getComponentAsync<IDialogService>("dialog-service")).showInlineDialogAsync(
                        `Rename cluster`,
                        `<p>New friendly name for cluster ${name}</p><input id="input-cluster-label" type="text" class = "input-flat" value="${name}"/>`,
                        `<button id="btn-new-label" type="submit" class="btn btn-primary" data-target="${name}">Rename</button><button id="btn-exit" type="button" class="btn btn-default">Cancel</button>`,
                        "../cluster-list/cluster-functionalities/rename-cluster.script.js");
                    break;

                case "move":
                    (await sfxModuleManager.getComponentAsync<IDialogService>("dialog-service")).showInlineDialogAsync(
                        `Move cluster`,
                        `<p>Choose a folder for cluster ${name} or move it out of a folder.</p>
                            <select id="input-select-folder" class="input-flat"></select> <br>
                            <div id="new_folder" style="visibility: hidden;">Enter Folder Name: <input id="new-folder-label" type="text" class=" input-flat" value=""/> </div>`,
                        `<button id="btn-move-cluster" type="submit" class="btn btn-primary" data-cluster="${name}">Move</button><button id="btn-exit" type="button" class="btn btn-default">Cancel</button>`,
                        "../cluster-list/cluster-functionalities/move-cluster.script.js");
                    break;

                default:
                    break;
            }
        });

        $($item).click(async (e) => {
            let $target = $(e.target);
            if ($target.is("span") || $target.is("img")) {
                $target = $target.parent();
            }

            const endpoint = $target.data("endpoint");
            const cluster = this.clusterListDataModel.getCluster(endpoint, "endpoint");

            if ($target.hasClass("current")) {
                return;
            }

            $(".current").removeClass("current");
            await (await sfxModuleManager.getComponentAsync<ISfxContainer>("page-sfx-container")).loadSfxAsync(endpoint);
            cluster.currentInView = true;
            await this.settings.setAsync<string>("cluster-list-folders", JSON.stringify(this.clusterListDataModel));
            $target.addClass("current");
        });
    }
}

$(document).ready(() => {
    (async () => {
        sfxModuleManager.register(ClusterList.getComponentInfo());
        const clusterListComponent = await sfxModuleManager.getComponentAsync<ClusterList>("cluster-list");
        await clusterListComponent.setupAsync();
    })();
});
