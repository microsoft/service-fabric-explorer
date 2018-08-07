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
import { Menu } from "./Model";
import { ISettings } from "sfx.settings"


export class ClusterList implements IClusterList {
    private menu: Menu;
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

    async parseSettings() {
        await this.settings.getAsync<Menu>("cluster-list-folders").then(async res => {
            if(res === undefined || res === null) {
                this.menu = new Menu();
                await this.settings.setAsync<Menu>("cluster-list-folders", this.menu);
               
            } else {
              
                this.menu = res;
            } 
        });
    
      
    }
   

    async newFolderItemAsync(label: string): Promise<void> {
       
        if (this.menu.getFolder(label)) {
            throw new Error("This folder already exists!");
        } else if (!label) {
            throw new Error("Please enter a folder name!");
        }
        const $item = $(`<li role="folder-${label}"><img src="../../../icons/Closedfolder.svg" style="width: 16px; height: 16px;"><span>${label}</span></li>`);
        $item.append(`<a role="button" class="bowtie-icon bowtie-ellipsis"></a>`);
        $item.append(`<ul role="menu" class="dropdown-menu" uib-dropdown-menu style="list-style: none">
            <li role="menuitem">
                <a role="menuitem" tabindex="-1" href="#">
                    Remove Folder
                </a>
            </li>
        </ul>`);
        $item.append(`<ul id="folder-${label.replace(/\s+/, "")}""></ul>`);
        $("#cluster-list-organized").append($item);
        this.menu.addFolder(label);
        await this.settings.setAsync<Menu>("cluster-list-folders", this.menu);

        $($item).click(async (e) => {
            let $button = $(e.target);
            if ($button.parent().parent().attr("id") === "cluster-list-organized") {
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
                }
            } else if ($button.parent().parent().parent().parent().attr("id") === "cluster-list-organized") {
                localStorage.setItem("folder", label);
                if ($button.attr("role") === "menuitem") {
                    if ($button.html().toString().trim() === "Remove Folder") {
                        (await sfxModuleManager.getComponentAsync<IDialogService>("dialog-service")).showDialogAsync("./cluster-list/folder-functionalities/delete-folder.html");
                        
                    }

                }
            }

        });

        return Promise.resolve();
    }


    async newListItemAsync(endpoint: string, name?: string, folder?: string): Promise<void> {
        $("#cluster-list .btn-success").removeClass("btn-success");
        if (!name) {
            name = endpoint;
        }
        if(this.menu.getCluster(name, "label")) {
            if(this.menu.getCluster(name, "label") === this.menu.getCluster(endpoint, "endpoint")) {
                $(`#cluster-list li[data-endpoint='${endpoint}']`).addClass("btn-success");
            } else{
                throw new Error("Clusters must have unique labels. Please enter a new name");
            }
        }
        if(this.menu.getCluster(endpoint, "endpoint")) {
            if(this.menu.getCluster(endpoint, "endpoint").label != name) {
                let new_name = confirm("Do you want to replace friendly name with " + name + " ?");
                if (new_name === true) {
                    this.renameCluster(this.menu.getCluster(endpoint, "endpoint").label, name);
                } else{
                    name = this.menu.getCluster(endpoint, "endpoint").label;
                }
            }
            if (this.menu.getCluster(endpoint, "endpoint").folder !== folder) {
                let new_folder = confirm("Do you want to place into new folder " + folder + " ?");
                if(new_folder === true) {
                    if(!this.menu.getFolder(folder)) {
                        this.newFolderItemAsync(folder);
                    }
                    this.moveCluster(this.menu.getCluster(endpoint, "endpoint").label, folder);
                } else{
                    folder = this.menu.getCluster(endpoint, "endpoint").folder;
                }
            }
            $(`#cluster-list li[data-endpoint='${endpoint}']`).addClass("btn-success");
            await this.settings.setAsync<Menu>("cluster-list-folders", this.menu);
        }
       
        if (!this.endpoints.find(e => e === endpoint)) {
            

            this.endpoints.push(endpoint);
            if(!this.menu.getFolder(folder)) {
                this.newFolderItemAsync(folder);
            }
            let folder_label: string = "#folder-" + folder.replace(/\s+/, "");
            if (folder === "----No Folder----") {
                folder_label = "#cluster-list";
            }
            const $item = $(`<li class="btn-success" data-endpoint="${endpoint}"><img src="../../../icons/icon16x16.png"><span>${name}</span></li>`);
            $(folder_label).append($item);

            $(`#cluster-list li[data-endpoint='${endpoint}']`).append(`<a role="button" class="bowtie-icon bowtie-ellipsis"></a>`);
            $(`#cluster-list li[data-endpoint='${endpoint}']`).append(`<ul role="menu" class="dropdown-menu" uib-dropdown-menu style="list-style: none">
                <li role="menuitem">
                    <a role="menuitem" tabindex="-1" href="#">
                        Remove Cluster
                    </a>
                </li>
                <li role="menuitem">
                    <a role="menuitem" tabindex="-1" href="#">
                        Rename Cluster
                    </a>
                </li>
                <li role="menuitem">
                    <a role="menuitem" tabindex="-1" href="#">
                        Move Cluster
                    </a>
                </li>
            </ul>`);

            this.menu.addCluster(name, endpoint, folder);
            await this.settings.setAsync<Menu>("cluster-list-folders", this.menu);

            // $($item).hover(async )
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
                    if ($button.html().toString().trim() === "Remove Cluster") {
                        (await sfxModuleManager.getComponentAsync<IDialogService>("dialog-service")).showDialogAsync("./cluster-list/cluster-functionalities/delete-cluster.html");
                        console.log("Remove Cluster clicked");
                    } else if ($button.html().toString().trim() === "Rename Cluster") {
                        (await sfxModuleManager.getComponentAsync<IDialogService>("dialog-service")).showDialogAsync("./cluster-list/cluster-functionalities/rename-cluster.html");
                        console.log("Rename Cluster clicked");
                    } else {
                        localStorage.setItem("folders", JSON.stringify(this.menu.getFolders()));
                        (await sfxModuleManager.getComponentAsync<IDialogService>("dialog-service")).showDialogAsync("./cluster-list/cluster-functionalities/move-cluster.html");
                        console.log("Move Cluster clicked");
                    }
                    return;
                } else {
                    if ($button.hasClass("btn-success")) {
                        return;
                    }

                    await (await sfxModuleManager.getComponentAsync<ISfxContainer>("page-sfx-container")).LoadSfxAsync($button.data("endpoint"));

                    $(".btn-success").removeClass("btn-success");
                    $button.addClass("btn-success");

                }

            });

            if($("#cluster-list li").length > 1) {
                $("#cluster-list").find("hr").css("visibility", "visable");
            } else {
    
                $("#cluster-list").find("hr").css("visibility", "hidden");
            }

        } else {            
            $(`#cluster-list li[data-endpoint='${endpoint}']`).addClass("btn-success");
        }

        return Promise.resolve();
    }

    async removeCluster(cluster_label: string): Promise<void> {
        let endpoint = this.menu.getCluster(cluster_label, "label");

        let $button = $('#cluster-list li[data-endpoint="' + endpoint.url + '"]');
        if ($button.hasClass("btn-success")) {
            await (await sfxModuleManager.getComponentAsync<ISfxContainer>("page-sfx-container")).LoadSfxAsync("#");
            $button.removeClass("btn-success");
        }
        $button.remove();
        this.endpoints.splice(this.endpoints.indexOf(endpoint.url), 1);
        this.menu.removeCluster(cluster_label, endpoint.folder);
        await this.settings.setAsync<Menu>("cluster-list-folders", this.menu);

    }

    async renameCluster(cluster_label: string, new_cluster: string): Promise<any> {
        if(cluster_label === new_cluster) {
            return;
        } else if (this.menu.getCluster(new_cluster, "label")) {
            throw new Error("Clusters must have uni")
        }
        let endpoint = this.menu.getCluster(cluster_label, "label");
        let $button = $('#cluster-list li[data-endpoint="' + endpoint.url + '"]');
        $button.find("span")[0].innerHTML = new_cluster;
        this.menu.renameCluster(cluster_label, new_cluster);
        await this.settings.setAsync<Menu>("cluster-list-folders", this.menu);
        return new_cluster;
    }

    async moveCluster(cluster_label: string, new_folder_label: string): Promise<void> {
        let endpoint = this.menu.getCluster(cluster_label, "label");
        let $button = $('#cluster-list li[data-endpoint="' + endpoint.url + '"]');

        let folder_label: string = "#folder-" + new_folder_label.replace(/\s+/, "");
        if (new_folder_label === "----No Folder----") {
            folder_label = "#cluster-list";
        }

        $(folder_label).append($button.clone(true, true));
        $button.remove();
        this.menu.moveCluster(cluster_label, new_folder_label);
        await this.settings.setAsync<Menu>("cluster-list-folders", this.menu);
    }

    async removeFolder(label: string): Promise<void> {
        let $button = $('#cluster-list li[role="folder-' + label + '"]');
        if ($button.find(".btn-success").length !== 0) {
            await (await sfxModuleManager.getComponentAsync<ISfxContainer>("page-sfx-container")).LoadSfxAsync("#");
            $(".btn-success").removeClass("btn-success");
        }
        $button.remove();
        let clusters = this.menu.getFolder(label).clusters;
        for (let cluster of clusters) {
            this.endpoints.splice(this.endpoints.indexOf(cluster.url), 1);
        }
        this.menu.removeFolder(label);
        await this.settings.setAsync<Menu>("cluster-list-folders", this.menu);
    }


    async setupAsync(): Promise<void> {
        $("#cluster-list-connect").click(async () => {
            localStorage.setItem("folders", JSON.stringify(this.menu.getFolders()));
            (await sfxModuleManager.getComponentAsync<IDialogService>("dialog-service")).showDialogAsync("./cluster-list/cluster-functionalities/connect-cluster.html");
        });
        $("#cluster-list-folder").click(async () => {
            (await sfxModuleManager.getComponentAsync<IDialogService>("dialog-service")).showDialogAsync("./cluster-list/folder-functionalities/folder.html");
        });

        return Promise.resolve();
    }
}

$(document).ready(() => {
    (async () => {    
        sfxModuleManager.register(ClusterList.getComponentInfo());
        const clusterListComponent = await sfxModuleManager.getComponentAsync<ClusterList>("cluster-list");
        await clusterListComponent.setupAsync();
    })();
});
