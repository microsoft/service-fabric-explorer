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

    private async parseSettings() {
          
        this.settings.getAsync<string>("cluster-list-folders").then(async res => {
            this.menu = new Menu();
            if(res === undefined || res === null) {
                this.menu.addFolder("----No Folder----");
                await this.settings.setAsync<string>("cluster-list-folders", JSON.stringify(this.menu));
               
               
            } else {
                let json = JSON.parse(res); 
                let endpoint: string = "";
                for(let folder of json.folders) {
                    if(folder.label === "----No Folder----") {
                        this.menu.addFolder("----No Folder----");
                    } else {
                        await this.newFolderItemAsync(folder.label);
                    }
                    for(let cluster of folder.clusters) {
                        await this.newClusterListItemAsync(cluster.url, cluster.label, cluster.folder);
                        endpoint = cluster.url;
                    }
                }
             
                if(endpoint !== "") {
                    await (await sfxModuleManager.getComponentAsync<ISfxContainer>("page-sfx-container")).LoadSfxAsync(endpoint);
                }
            } 
        });
    }
   

    async newFolderItemAsync(label: string): Promise<void> {
       
        if (this.menu.getFolder(label)) {
            throw new Error("This folder already exists!");
        } else if (!label) {
            throw new Error("Please enter a folder name!");
        }
        const $item = $(`<li class="hoverable-link" role="folder-${label}"></li>`);
        $item.append(`<div class="folder"><img src="../../../icons/Closedfolder.svg" style="width: 16px; height: 16px;"><span>${label}</span>
                    <a role="button" class="bowtie-icon bowtie-ellipsis"></a></div>`);
        $item.append(`<ul role="menu" class="dropdown-menu" uib-dropdown-menu style="list-style: none">
            <li role="menuitem">
                <a role="menuitem" tabindex="-1" href="#">
                    Remove Folder
                </a>
            </li>
        </ul>`);
    
        $item.append(`<ul id="folder-${label.replace(/\s+/g, "")}""></ul>`);
        $("#cluster-list-organized").append($item);
        this.menu.addFolder(label);
        await this.settings.setAsync<string>("cluster-list-folders", JSON.stringify(this.menu));
       
        let $folder_only = $item.find(".folder");
       
        $($folder_only).hover(async () => {
           
            $folder_only.css("background-color", "#3C3C3C");
            let ellipsis = $($item).find(".bowtie-ellipsis").first();
            ellipsis.css("visibility", "visible");
    
        }, async () => {
            
            $folder_only.css("background-color", "transparent");
            let ellipsis = $($item).find(".bowtie-ellipsis").first();
            ellipsis.css("visibility", "hidden");
            
        });

        this.handleFolderClick($item, label);
        return Promise.resolve();
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

            //This handles if a menu-item in the dropdown-menu is clicked
            } else if ($button.parent().parent().hasClass("dropdown-menu")) {
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


    async newClusterListItemAsync(endpoint: string, name?: string, folder?: string): Promise<void> {
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
        if(this.endpoints.find(e => e === endpoint)) {
            if(this.menu.getCluster(endpoint, "endpoint").label != name) {
                let new_name = confirm("Do you want to replace friendly name with " + name + " ?");
                if (new_name === true) {
                    this.renameClusterListItem(this.menu.getCluster(endpoint, "endpoint").label, name);
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
                    this.moveClusterListItem(this.menu.getCluster(endpoint, "endpoint").label, folder);
                } else{
                    folder = this.menu.getCluster(endpoint, "endpoint").folder;
                }
            }
            $(`#cluster-list li[data-endpoint='${endpoint}']`).addClass("btn-success");
            await this.settings.setAsync<string>("cluster-list-folders", JSON.stringify(this.menu));
        }
       
        if (!this.endpoints.find(e => e === endpoint)) {
            this.endpoints.push(endpoint);
            if(!this.menu.getFolder(folder)) {
                this.newFolderItemAsync(folder);
            }
            let folder_label: string = "#folder-" + folder.replace(/\s+/g, "");
            if (folder === "----No Folder----") {
                folder_label = "#cluster-list";
            }
            const $item = $(`<li class="btn-success cluster" data-endpoint="${endpoint}"><img src="../../../icons/icon16x16.png"><span>${name}</span></li>`);
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
            await this.settings.setAsync<string>("cluster-list-folders", JSON.stringify(this.menu));

            $($item).hover(async () => {
                if(!$item.hasClass("btn-success")) {
                    $item.css("background-color", "#3C3C3C");
                }
                let ellipsis = $($item).find(".bowtie-ellipsis").first();
                ellipsis.css("visibility", "visible");
                $item.click(() => {
                    $item.css("background-color", "");
                });
            }, async () => {
                $item.css("background-color", "");
                let ellipsis = $($item).find(".bowtie-ellipsis").first();
                ellipsis.css("visibility", "hidden");
            });
            
            this.handleClusterListItemClick($item, endpoint, name);  

        } else {            
            $(`#cluster-list li[data-endpoint='${endpoint}']`).addClass("btn-success");
        }

        return Promise.resolve();
    }

    private async handleClusterListItemClick($item, endpoint: string, name: string) {
        $($item).click(async (e) => {
            console.log("clicked cluster");
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
                } else if ($button.html().toString().trim() === "Rename Cluster") {
                    (await sfxModuleManager.getComponentAsync<IDialogService>("dialog-service")).showDialogAsync("./cluster-list/cluster-functionalities/rename-cluster.html");
                } else {
                    localStorage.setItem("folders", JSON.stringify(this.menu.getFolders()));
                    (await sfxModuleManager.getComponentAsync<IDialogService>("dialog-service")).showDialogAsync("./cluster-list/cluster-functionalities/move-cluster.html");
                }
                return;
            } else {
                if ($button.hasClass("btn-success") || $button.parent().hasClass(".btn-success")) {
                    return;
                }

                $(".btn-success").removeClass("btn-success");
                
                if($button.is("span") || $button.is("img")) {
                    await (await sfxModuleManager.getComponentAsync<ISfxContainer>("page-sfx-container")).LoadSfxAsync($button.parent().data("endpoint"));
                    $button.parent().addClass("btn-success");
                } else {
                    await (await sfxModuleManager.getComponentAsync<ISfxContainer>("page-sfx-container")).LoadSfxAsync($button.data("endpoint"));
                    $button.addClass("btn-success");
                }

            }

        });
    }
 
    async removeClusterListItem(cluster_label: string): Promise<void> {
        let endpoint = this.menu.getCluster(cluster_label, "label");

        let $button = $('#cluster-list li[data-endpoint="' + endpoint.url + '"]');
        if ($button.hasClass("btn-success")) {
            await (await sfxModuleManager.getComponentAsync<ISfxContainer>("page-sfx-container")).UnloadSfxAsync(endpoint.url);
            $button.removeClass("btn-success");
        }
        $button.remove();
        this.endpoints.splice(this.endpoints.indexOf(endpoint.url), 1);
        this.menu.removeCluster(cluster_label, endpoint.folder);
        await this.settings.setAsync<string>("cluster-list-folders", JSON.stringify(this.menu));
       

    }

    async renameClusterListItem(cluster_label: string, new_cluster: string): Promise<any> {
        if(cluster_label === new_cluster) {
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
        await this.settings.setAsync<string>("cluster-list-folders", JSON.stringify(this.menu));
       
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
