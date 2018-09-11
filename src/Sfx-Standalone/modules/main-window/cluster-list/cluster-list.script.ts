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
import { ClusterListDataModel } from "./Model";
import { ISettings } from "sfx.settings";

export class ClusterList implements IClusterList {
    private menu: ClusterListDataModel;
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

    async newFolderItemAsync(label: string): Promise<void> {
        if (this.menu.getFolder(label)) {
            throw new Error("This folder already exists!");
        } else if (!label) {
            throw new Error("Please enter a folder name!");
        }
        const $item = $(
            `<li class="hoverable-link list-item" role="">
                <div class="folder"><img src="../../../icons/Closedfolder.svg" style="width: 16px; height: 16px;"><span>${label}</span>
                    <a role="button" class="bowtie-icon bowtie-ellipsis"></a>
                </div>
                <ul role="menu" class="dropdown-menu" uib-dropdown-menu style="list-style: none">
                    <li role="menuitem">
                        <a role="menuitem" href="#">Remove Folder</a>
                    </li>
                </ul>
                <ul id="folder-${label.replace(/\s+/g, "")}""></ul>
            </li>`);

        $("#cluster-list-organized").append($item);
        this.menu.addFolder(label);
        await this.settings.setAsync<string>("cluster-list-folders", JSON.stringify(this.menu));

        let $folder_only = $item.find(".folder");

        $($folder_only).hover(
            async () => {
                $folder_only.css("background-color", "#3C3C3C");
                let ellipsis = $($item).find(".bowtie-ellipsis").first();
                ellipsis.css("visibility", "visible");
            },
            async () => {
                $folder_only.css("background-color", "transparent");
                let ellipsis = $($item).find(".bowtie-ellipsis").first();
                ellipsis.css("visibility", "hidden");
            });

        this.handleFolderClick($item, label);
        return Promise.resolve();
    }

    async newClusterListItemAsync(endpoint: string, name?: string, folder?: string): Promise<void> {
        $("#cluster-list .current").removeClass("current");
        if (!name) {
            name = endpoint;
        }

        if (this.menu.getCluster(name, "label")) {
            if (this.menu.getCluster(name, "label") === this.menu.getCluster(endpoint, "endpoint")) {
                $(`#cluster-list li[data-endpoint='${endpoint}']`).addClass("current");
            } else {
                throw new Error("Clusters must have unique labels. Please enter a new name");
            }
        }

        if (this.endpoints.find(e => e === endpoint)) {
            if (this.menu.getCluster(endpoint, "endpoint").label !== name) {
                let new_name = confirm("Do you want to replace friendly name with " + name + " ?");
                if (new_name === true) {
                    this.renameClusterListItem(this.menu.getCluster(endpoint, "endpoint").label, name);
                } else {
                    name = this.menu.getCluster(endpoint, "endpoint").label;
                }
            }
            if (this.menu.getCluster(endpoint, "endpoint").folder !== folder) {
                let new_folder = confirm("Do you want to place into new folder " + folder + " ?");
                if (new_folder === true) {
                    if (!this.menu.getFolder(folder)) {
                        this.newFolderItemAsync(folder);
                    }
                    this.moveClusterListItem(this.menu.getCluster(endpoint, "endpoint").label, folder);
                } else {
                    folder = this.menu.getCluster(endpoint, "endpoint").folder;
                }
            }
            $(`#cluster-list li[data-endpoint='${endpoint}']`).addClass("current");
            await this.settings.setAsync<string>("cluster-list-folders", JSON.stringify(this.menu));
        }

        if (!this.endpoints.find(e => e === endpoint)) {
            this.endpoints.push(endpoint);
            if (!this.menu.getFolder(folder)) {
                this.newFolderItemAsync(folder);
            }
            let folder_label: string = "#folder-" + folder.replace(/\s+/g, "");
            if (folder === "----No Folder----") {
                folder_label = "#cluster-list";
            }
            const $item = $(`
                <li tabindex="0" class="current cluster list-item" data-endpoint="${endpoint}">
                    <img src="../../../icons/icon16x16.png"><span>${name}</span>
                    <a tabindex="0" role="button" class="bowtie-icon bowtie-ellipsis"></a>
                    <ul role="menu" class="dropdown-menu" uib-dropdown-menu>
                        <li role="menuitem">
                            <a role="menuitem" href="#" data-action="remove">Remove Cluster</a>
                        </li>
                        <li role="menuitem"><a role="menuitem" href="#" data-action="rename">Rename Cluster</a>
                        </li>
                        <li role="menuitem"><a role="menuitem" href="#" data-action="move">Move Cluster</a>
                        </li>
                    </ul>
                </li>`);
            $(folder_label).append($item);

            this.menu.addCluster(name, endpoint, folder);
            await this.settings.setAsync<string>("cluster-list-folders", JSON.stringify(this.menu));
            this.handleClusterListItemClick($item, endpoint, name);
        } else {
            $(`#cluster-list li[data-endpoint='${endpoint}']`).addClass("current");
        }

        return Promise.resolve();
    }


    async removeClusterListItem(cluster_label: string): Promise<void> {
        let endpoint = this.menu.getCluster(cluster_label, "label");

        let $button = $('#cluster-list li[data-endpoint="' + endpoint.url + '"]');
        if ($button.hasClass("current")) {
            await (await sfxModuleManager.getComponentAsync<ISfxContainer>("page-sfx-container")).UnloadSfxAsync(endpoint.url);
            $button.removeClass("current");
        }
        $button.remove();
        this.endpoints.splice(this.endpoints.indexOf(endpoint.url), 1);
        this.menu.removeCluster(cluster_label, endpoint.folder);
        await this.settings.setAsync<string>("cluster-list-folders", JSON.stringify(this.menu));
    }

    async renameClusterListItem(cluster_label: string, new_cluster: string): Promise<any> {
        if (cluster_label === new_cluster) {
            return;
        } else if (this.menu.getCluster(new_cluster, "label")) {
            throw new Error("Clusters must have unique labels. Please enter a new name");
        }
        let endpoint = this.menu.getCluster(cluster_label, "label");
        let $button = $('#cluster-list li[data-endpoint="' + endpoint.url + '"]');
        $button.find("span")[0].innerHTML = new_cluster;
        this.menu.renameCluster(cluster_label, new_cluster);
        await this.settings.setAsync<string>("cluster-list-folders", JSON.stringify(this.menu));

        return new_cluster;
    }

    async moveClusterListItem(cluster_label: string, new_folder_label: string): Promise<void> {
        let endpoint = this.menu.getCluster(cluster_label, "label");
        let $button = $('#cluster-list li[data-endpoint="' + endpoint.url + '"]');

        let folder_label: string = "#folder-" + new_folder_label.replace(/\s+/g, "");
        if (new_folder_label === "----No Folder----") {
            folder_label = "#cluster-list";
        }

        $(folder_label).append($button.clone(true, true));
        $button.remove();
        this.menu.moveCluster(cluster_label, new_folder_label);
        await this.settings.setAsync<string>("cluster-list-folders", JSON.stringify(this.menu));

    }

    async removeFolderItem(label: string): Promise<void> {
        let $button = $('#cluster-list li[role="folder-' + label + '"]');
        if ($button.find(".current").length !== 0) {
            await (await sfxModuleManager.getComponentAsync<ISfxContainer>("page-sfx-container")).LoadSfxAsync("#");
            $(".current").removeClass("current");
        }
        $button.remove();
        let clusters = this.menu.getFolder(label).clusters;
        for (let cluster of clusters) {
            this.endpoints.splice(this.endpoints.indexOf(cluster.url), 1);
        }

        this.menu.removeFolder(label);
        await this.settings.setAsync<string>("cluster-list-folders", JSON.stringify(this.menu));
    }

    async setupAsync(): Promise<void> {
        $("#cluster-list-connect").click(async () => {
            localStorage.setItem("folders", JSON.stringify(this.menu.getFolders()));
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
                <p>Choose Folder (Optional)</p>
                <select id="input-select-folder" class="input-flat"></select> <br>
                <div id="new_folder" style="visibility: hidden;">Enter Folder Name: <input id="new-folder-label" type="text" class=" input-flat" value=""/> </div>`,
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
            this.menu = new ClusterListDataModel();
            if (res === undefined || res === null) {
                this.menu.addFolder("----No Folder----");
                await this.settings.setAsync<string>("cluster-list-folders", JSON.stringify(this.menu));

            } else {
                let json = JSON.parse(res);
                let endpoint: string = "";
                for (let folder of json.folders) {
                    if (folder.label === "----No Folder----") {
                        this.menu.addFolder("----No Folder----");
                    } else {
                        await this.newFolderItemAsync(folder.label);
                    }
                    for (let cluster of folder.clusters) {
                        await this.newClusterListItemAsync(cluster.url, cluster.label, cluster.folder);
                        endpoint = cluster.url;
                    }
                }

                if (endpoint !== "") {
                    await (await sfxModuleManager.getComponentAsync<ISfxContainer>("page-sfx-container")).LoadSfxAsync(endpoint);
                }
            }
        });
    }

    private async handleFolderClick($item, label: string) {
        $($item).click(async (e) => {
            let $button = $(e.target);

            //This handles if the ellipses is clicked
            if ($button.parent().hasClass("folder")) {
                if ($button.attr("class") === "bowtie-icon bowtie-ellipsis") {

                    if ($button.parent().next().hasClass("dropdown-menu-show")) {
                        $button.parent().next().removeClass("dropdown-menu-show");
                    } else {
                        $(".dropdown-menu-show").removeClass("dropdown-menu-show");
                        $button.parent().next().addClass("dropdown-menu-show");
                    }

                    $(document).mouseup((e) => {
                        let container = $(".dropdown-menu-show");
                        if (!container.is(e.target) && container.has(e.target).length === 0) {
                            $(".dropdown-menu-show").removeClass("dropdown-menu-show");
                        }
                    });
                    return;
                }
            } else if ($button.parent().parent().hasClass("dropdown-menu")) {
                //This handles if a menu-item in the dropdown-menu is clicked
                localStorage.setItem("folder", label);
                if ($button.attr("role") === "menuitem") {
                    if ($button.html().toString().trim() === "Remove Folder") {
                        (await sfxModuleManager.getComponentAsync<IDialogService>("dialog-service")).showDialogAsync("./cluster-list/folder-functionalities/delete-folder.html");
                    }
                }
                return;
            }
        });
    }

    private async handleClusterListItemClick($item, endpoint: string, name: string) {
        $($item).click(async (e) => {
            const $button = $(e.target);
            if ($button.attr("class") === "bowtie-icon bowtie-ellipsis") {
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

                return;
            } else if ($button.attr("role") === "menuitem") {
                $(".dropdown-menu-show").removeClass("dropdown-menu-show");
                if (this.menu.getCluster(endpoint, "endpoint").label !== name) {
                    name = this.menu.getCluster(endpoint, "endpoint").label;
                }

                localStorage.setItem("cluster", name);
                const action = $button.data("action");
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
                            `<button id="btn-new-label" type="submit" class="btn btn-primary">Rename</button><button id="btn-exit" type="button" class="btn btn-default">Cancel</button>`,
                            "../cluster-list/cluster-functionalities/rename-cluster.script.js");
                        break;

                    case "move":
                        localStorage.setItem("folders", JSON.stringify(this.menu.getFolders()));
                        (await sfxModuleManager.getComponentAsync<IDialogService>("dialog-service")).showDialogAsync("./cluster-list/cluster-functionalities/move-cluster.html");
                        break;

                    default:
                        break;
                }

                return;
            } else {
                if ($button.hasClass("current") || $button.parent().hasClass("current")) {
                    return;
                }

                $(".current").removeClass("current");

                if ($button.is("span") || $button.is("img")) {
                    await (await sfxModuleManager.getComponentAsync<ISfxContainer>("page-sfx-container")).LoadSfxAsync($button.parent().data("endpoint"));
                    $button.parent().addClass("current");
                } else {
                    await (await sfxModuleManager.getComponentAsync<ISfxContainer>("page-sfx-container")).LoadSfxAsync($button.data("endpoint"));
                    $button.addClass("current");
                }
            }
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
