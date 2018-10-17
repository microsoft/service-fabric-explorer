//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as $ from "jquery";
import * as Url from "url";
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
                    <button tabindex="0" class="bowtie-icon bowtie-ellipsis"></button>
                </div>
                <ul role="menu" class="dropdown-menu" uib-dropdown-menu style="list-style: none">
                    <li role="menuitem">
                        <a role="menuitem" href="#">Remove Folder</a>
                    </li>
                </ul>
                <ul id="folder-${name.replace(/\s+/g, "")}"></ul>
            </li>`);

        $("#cluster-list-organized").append($item);
        this.clusterListDataModel.addFolder(name);
        await this.settings.setAsync<string>("cluster-list-folders", JSON.stringify(this.clusterListDataModel));
        this.setupFolderItemHandler($item, name);
        return Promise.resolve();
    }

    async newClusterListItemAsync(endpoint: string, displayName?: string, folder?: string, isCurrentInView?: boolean): Promise<void> {
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
                    <img src="../../icons/icon16x16.png"><span>${displayName}</span>
                    <button tabindex="0" class="bowtie-icon bowtie-ellipsis"></button>
                    <ul role="menu" class="dropdown-menu" uib-dropdown-menu>
                        <li role="menuitem"><a class="cluster-action" role="menuitem" href="#" data-action="connect">Re-connect</a></li>
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
            const dialogService = (await sfxModuleManager.getComponentAsync<IDialogService>("dialog-service"));
            await dialogService.showInlineDialogAsync({
                title: "Connect to a cluster",
                bodyHtml: `<p>Cluster URL</p>
                    <input id="input-cluster-url" type="text" class = "input-flat" value=""/>
                    <div class="checkbox-container">
                        <label for="input-connect-locally">
                            <input id="input-connect-locally" type="checkbox" /><label></label>Connect to localhost
                        </label>
                    </div> <br>
                    <p>Friendly name (Optional)</p>
                    <input id="input-cluster-label" type="text" class="input-flat" value="" /><br><br>
                    <p>Choose a folder (optional)</p>
                    <select id="input-select-folder" class="input-flat"></select> 
                    <div id="new_folder" style="visibility: hidden;" class="div-container">Folder name <input id="new-folder-label" type="text" class="input-flat" value=""/> </div>`,
                footerHtml: `<button id="btn-connect" type="submit" class="btn btn-primary">Connect</button><button type="button" class="btn btn-default" id="btn-exit">Cancel</button>`,
                scriptPath: "../cluster-list/cluster-functionalities/connect-cluster.script.js",
                height: 440
            });

            const list = await sfxModuleManager.getComponentAsync<IClusterList>("cluster-list");
            const folders = await (await list.getDataModel()).getFolders();
            let select = $("#input-select-folder");

            for (let i = 0; i < await folders.length; i++) {
                let folderName = await (await folders[i]).name;
                select.append($(`<option value="${folderName}">${folderName === "" ? "--- No folder ---" : folderName}</option>`));
            }

            select.append($(`<option data-action="new">Create a new folder</option>`));

            $("#input-select-folder").change(() => $("#new_folder").css("visibility", $("#input-select-folder option:selected").data("action") === "new" ? "visible" : "hidden"));

            $("#btn-connect").click(async () => {
                try {
                    const url = Url.parse($("#input-cluster-url").val());
                    const isCreatingNewFolder = $("#input-select-folder option:selected").data("action") === "new";
                    let name: string = $("#input-cluster-label").val();
                    let folder: string = isCreatingNewFolder ? $("#new-folder-label").val() : $("#input-select-folder").val();

                    if (folder === "" && isCreatingNewFolder) {
                        throw new Error("Folder must have name!");
                    }

                    if (url.protocol !== "http:" && url.protocol !== "https:") {
                        throw new Error("The protocol of the cluster url is not supported. Only HTTP and HTTPS are supported.");
                    }

                    const endpoint = url.protocol + "//" + url.host;
                    if (!name) {
                        name = url.host;
                    }

                    console.log("connecting...");
                    await (await sfxModuleManager.getComponentAsync<IClusterList>("cluster-list")).newClusterListItemAsync(endpoint, name, folder, true);
                    await (await sfxModuleManager.getComponentAsync<ISfxContainer>("page-sfx-container")).loadSfxAsync(endpoint).then(() => {
                        $("#main-modal-dialog").modal("hide");
                    });
                } catch (error) {
                    alert((<Error>error).message);
                }
            });

            $("#input-cluster-url").keyup(($event) => {
                const keyboardEvent = <KeyboardEvent>$event.originalEvent;

                if (keyboardEvent.code === "Enter") {
                    $("#btn-connect").click();
                }
            });

            $("#input-connect-locally").change(($event) => {
                const $sender = $($event.target);
                if ($sender.prop("checked")) {
                    $("#input-cluster-url").val("https://localhost:19080");
                }

                $("#input-cluster-url").prop("disabled", $sender.prop("checked"));
            });

            $("#btn-exit").click(() => {
                $("#main-modal-dialog").modal("hide");
            });

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
                if ($eventTarget.attr("role") === "menuitem") {
                    if ($eventTarget.html().toString().trim() === "Remove Folder") {
                        await (await sfxModuleManager.getComponentAsync<IDialogService>("dialog-service")).showInlineDialogAsync({
                            title: `Remove folder`,
                            bodyHtml: `<p>Are you sure you want to remove folder ${name} and all cluster connections under it?</p>`,
                            footerHtml: `<button id="btn-delete-folder" type="submit" class="btn btn-primary" data-target="${name}">Remove</button><button id="btn-exit" type="button" class="btn btn-default">Cancel</button>`,
                            scriptPath: "../cluster-list/folder-functionalities/delete-folder.script.js"
                        });

                        $("#btn-delete-folder").click(async () => {
                            try {
                                const list = await sfxModuleManager.getComponentAsync<IClusterList>("cluster-list");
                                await list.removeFolder($("#btn-delete-folder").data("target"));
                                $("#main-modal-dialog").modal("hide");
                            } catch (error) {
                                alert("Error Occured");
                            }
                        });
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
            const dialogService = await sfxModuleManager.getComponentAsync<IDialogService>("dialog-service");
            switch (action) {
                case "connect":
                    const sfxContainer = await sfxModuleManager.getComponentAsync<ISfxContainer>("page-sfx-container");
                    await sfxContainer.reloadSfxAsync(endpoint);                    
                    break;
                case "remove":
                    await dialogService.showInlineDialogAsync({
                        title: `Remove cluster`,
                        bodyHtml: `<p>Are you sure you want to remove ${name}?</p>`,
                        footerHtml: `<button id="btn-delete-cluster" data-target="${name}" type="submit" class="btn btn-primary">Remove</button><button id="btn-exit" type="button" class="btn btn-default">Cancel</button>`,
                        scriptPath: "../cluster-list/cluster-functionalities/delete-cluster.script.js",
                        height: 200
                    });

                    const targetCluster = $("#btn-delete-cluster").data("target");
                    $("#btn-delete-cluster").click(async () => {
                        try {
                            const list = await sfxModuleManager.getComponentAsync<IClusterList>("cluster-list");
                            await list.removeClusterListItem(targetCluster);
                            $("#main-modal-dialog").modal("hide");
                        } catch (error) {
                            alert("Error Occured");
                        }
                    });
            
                    $("#btn-exit").click(() => {
                        $("#main-modal-dialog").modal("hide");
                    });

                    break;

                case "rename":
                    await dialogService.showInlineDialogAsync({
                        title: `Rename cluster`,
                        bodyHtml: `<p>New friendly name for cluster ${name}</p><input id="input-cluster-label" type="text" class = "input-flat" value="${name}"/>`,
                        footerHtml: `<button id="btn-new-label" type="submit" class="btn btn-primary" data-target="${name}">Rename</button><button id="btn-exit" type="button" class="btn btn-default">Cancel</button>`,
                        scriptPath: "../cluster-list/cluster-functionalities/rename-cluster.script.js",
                        height: 200
                    });
                    
                    $("#btn-new-label").click(async (e) => {
                        try {
                            let label: string = $("#input-cluster-label").val();
                            if (label !== "") {
                                const list = await sfxModuleManager.getComponentAsync<IClusterList>("cluster-list");
                                await list.renameClusterListItem($("#btn-new-label").data("target"), label);
            
                                $("#main-modal-dialog").modal("hide");
                            }
                        } catch (error) {
                            alert(error.message);
                        }
                    });
            
                    $("#btn-exit").click(() => {
                        $("#main-modal-dialog").modal("hide");
                    });

                    break;

                case "move":
                    await dialogService.showInlineDialogAsync({
                        title: `Move cluster`,
                        bodyHtml: `<p>Choose a folder for cluster ${name} or move it out of a folder.</p>
                            <select id="input-select-folder" class="input-flat"></select> <br>
                            <div id="new_folder" style="visibility: hidden;" class="div-container">Folder name<input id="new-folder-label" type="text" class=" input-flat" value=""/> </div>`,
                        footerHtml: `<button id="btn-move-cluster" type="submit" class="btn btn-primary" data-cluster="${name}">Move</button><button id="btn-exit" type="button" class="btn btn-default">Cancel</button>`,
                        scriptPath: "../cluster-list/cluster-functionalities/move-cluster.script.js",
                        height: 260
                    });

                    const list = await sfxModuleManager.getComponentAsync<IClusterList>("cluster-list");
                    const folders = await (await list.getDataModel()).getFolders();
                    const select = $("#input-select-folder");
                    const cluster = $("#btn-move-cluster").data("cluster");
            
                    for (let i = 0; i < await folders.length; i++) {
                        let folderName = await (await folders[i]).name;
                        select.append($(`<option value="${folderName}">${folderName === "" ? "--- No folder ---" : folderName}</option>`));
                    }
            
                    select.append($(`<option data-action="new">Create a new folder</option>`));
            
                    $("#input-select-folder").change(() => $("#new_folder").css("visibility", $("#input-select-folder option:selected").data("action") === "new" ? "visible" : "hidden"));
            
                    $("#btn-move-cluster").click(async () => {
                        try {
                            let folder: string = $("#input-select-folder").val().toString();
                            let new_folder: string = $("#new-folder-label").val().toString();
            
                            if (new_folder) {
                                await list.newFolderItemAsync(new_folder);
                                await list.moveClusterListItem(cluster, new_folder);
                            } else {
            
                            }
            
                            await list.moveClusterListItem(cluster, folder);
            
                            $("#main-modal-dialog").modal("hide");
                        } catch (error) {
                            alert("Error Occured");
                        }
                    });
            
                    $("#btn-exit").click(() => {
                        $("#main-modal-dialog").modal("hide");
                    });
            
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
            const sfxContainer = await sfxModuleManager.getComponentAsync<ISfxContainer>("page-sfx-container");
            await sfxContainer.loadSfxAsync(endpoint);
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
