//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as $ from "jquery";
import * as Url from "url";
import { electron } from "../../../utilities/electron-adapter";
import { IClusterList, IClusterListDataModel } from "sfx.cluster-list";
import { IDialogService, IDialogFooterButtonOption } from "sfx.main-window";
import { ClusterListDataModel } from "./data-model";
import { ISettings } from "sfx.settings";
import { DialogService } from "../dialog-service/dialog-service";
import { SfxContainer } from "./../sfx-container/sfx-container";

export class ClusterList implements IClusterList {
    private clusterListDataModel: ClusterListDataModel;
    private endpoints: string[] = [];
    private settings: ISettings;
    private dialogService: IDialogService;
    private sfxContainer: SfxContainer;

    public static getComponentInfo(): Donuts.Modularity.IComponentInfo<ClusterList> {
        return {
            name: "cluster-list",
            version: electron.app.getVersion(),
            singleton: true,
            descriptor: async (settings: ISettings) => new ClusterList(settings),
            deps: ["sfx.settings"]
        };
    }

    private static encodeHtml(str) {
        return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    constructor(settings: ISettings) {
        this.settings = settings;
        this.parseSettings();

        this.dialogService = new DialogService();
        this.sfxContainer = new SfxContainer();
    }

    public async getDataModel(): Promise<IClusterListDataModel> {
        return Promise.resolve(this.clusterListDataModel);
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
            const $item = $(`
                <li tabindex="0" class="cluster list-item" data-endpoint="${endpoint}" title="${ClusterList.encodeHtml(displayName)}">
                    <img src="../../icons/icon16x16.png" class="collapsed-show" /><span>${ClusterList.encodeHtml(displayName)}</span>
                    <button tabindex="0" class="bowtie-icon bowtie-ellipsis collapsed-hidden"></button>
                    <ul role="menu" class="dropdown-menu" uib-dropdown-menu>
                        <li role="menuitem"><a class="cluster-action" role="menuitem" href="#" data-action="connect">Re-connect</a></li>
                        <li role="menuitem"><a class="cluster-action" role="menuitem" href="#" data-action="remove">Remove Cluster</a></li>
                        <li role="menuitem"><a class="cluster-action" role="menuitem" href="#" data-action="rename">Rename Cluster</a></li>                        
                    </ul>
                </li>`);

            $("#cluster-list").append($item);

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
            await this.sfxContainer.unloadSfxAsync(endpoint.endpoint);
            $button.removeClass("current");
        }

        $button.remove();
        this.endpoints.splice(this.endpoints.indexOf(endpoint.endpoint), 1);
        this.clusterListDataModel.removeCluster(cluster_label, endpoint.folder);
        await this.settings.setAsync<string>("cluster-list-folders", JSON.stringify(this.clusterListDataModel));

        return Promise.resolve();
    }

    async renameClusterListItem(clusterName: string, newClusterName: string): Promise<any> {
        if (clusterName === newClusterName) {
            return;
        } else if (this.clusterListDataModel.getCluster(newClusterName, "label")) {
            throw new Error("Clusters must have unique labels. Please enter a new name");
        }

        let endpoint = this.clusterListDataModel.getCluster(clusterName, "label");
        let $button = $('#cluster-list li[data-endpoint="' + endpoint.endpoint + '"]');
        $button.find("span")[0].innerHTML = newClusterName;
        this.clusterListDataModel.renameCluster(clusterName, newClusterName);
        await this.settings.setAsync<string>("cluster-list-folders", JSON.stringify(this.clusterListDataModel));

        return newClusterName;
    }

    async setupAsync(): Promise<void> {
        $("#cluster-list-connect").click(async () => {
            await this.dialogService.showInlineDialogAsync({
                title: "Connect to a cluster",
                bodyHtml: `
                    <div class="mb-12px">
                        <label for="input-cluster-url">Cluster URL</label>                
                        <input id="input-cluster-url" type="text" class="input-flat" placeholder="http://localhost:19080"/>                    
                    </div>
                    <div class="mb-12px">                        
                        <label for="input-cluster-label">Friendly name (Optional)</label>                
                        <input id="input-cluster-label" type="text" class="input-flat" value="" />
                    </div>`,                
                footerButtons: <IDialogFooterButtonOption[]>[
                    <IDialogFooterButtonOption>{ text: "Connect", type: "submit", cssClass: "btn btn-primary", id: "btn-connect" },
                    <IDialogFooterButtonOption>{ text: "Cancel", type: "button", cssClass: "btn btn-default" }
                ],
                height: 440
            });

            $("#btn-connect").click(async () => {
                try {
                    if ($("#input-cluster-url").val() === "") {
                        $("#input-cluster-url").val("http://localhost:19080");
                    }

                    const url = Url.parse($("#input-cluster-url").val());
                    let name: string = $("#input-cluster-label").val();
                    if (url.protocol !== "http:" && url.protocol !== "https:") {
                        throw new Error("The protocol of the cluster url is not supported. Only HTTP and HTTPS are supported.");
                    }

                    const endpoint = url.protocol + "//" + url.host;
                    if (!name) {
                        name = url.host;
                    }

                    await this.newClusterListItemAsync(endpoint, name, "", true);
                    await this.sfxContainer.loadSfxAsync(endpoint).then(() => {
                        $("#main-modal-dialog").modal("hide");
                    });
                } catch (error) {
                    alert((<Error>error).message);
                }
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
                    for (let cluster of folder.clusters) {
                        await this.newClusterListItemAsync(cluster.endpoint, cluster.displayName, cluster.folder);
                    }
                }
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
                case "connect":
                    let $button = $('#cluster-list li[data-endpoint="' + endpoint + '"]');
                    if (!$button.hasClass("current")) {
                        $("#cluster-list li").removeClass("current");
                        $button.addClass("current");
                    }

                    await this.sfxContainer.reloadSfxAsync(endpoint);
                    break;
                case "remove":
                    await this.dialogService.showInlineDialogAsync({
                        title: `Remove cluster`,
                        bodyHtml: `<p>Are you sure you want to remove ${name}?</p>`,                        
                        footerButtons: <IDialogFooterButtonOption[]>[
                            <IDialogFooterButtonOption>{ text: "Remove", type: "submit", cssClass: "btn btn-primary", id: "btn-delete-cluster", attributes: { "data-target": `${name}` } },
                            <IDialogFooterButtonOption>{ text: "Cancel", type: "button", cssClass: "btn btn-default" }
                        ],
                        height: 200
                    });

                    const targetCluster = $("#btn-delete-cluster").data("target");
                    $("#btn-delete-cluster").click(async () => {
                        try {
                            await this.removeClusterListItem(targetCluster);
                            $("#main-modal-dialog").modal("hide");
                        } catch (error) {
                            alert(error);
                        }
                    });

                    break;
                case "rename":
                    const url = Url.parse(endpoint);
                    await this.dialogService.showInlineDialogAsync({
                        title: `Rename cluster`,
                        bodyHtml: `<p>New friendly name for cluster ${name}</p><p><i>Leave it blank to use the default name.</i></p><input id="input-cluster-label" type="text" class = "input-flat" placeholder="${url.host}" value="${name}"/>`,
                        footerButtons: <IDialogFooterButtonOption[]>[
                            <IDialogFooterButtonOption>{ text: "Rename", type: "submit", cssClass: "btn btn-primary", id: "btn-new-label", attributes: { "data-target": `${name}` } },
                            <IDialogFooterButtonOption>{ text: "Cancel", type: "button", cssClass: "btn btn-default" }
                        ],
                        height: 200
                    });

                    $("#btn-new-label").click(async (e) => {
                        try {
                            let label: string = $("#input-cluster-label").val();
                            if (label === "") {
                                label = $("#input-cluster-label").attr("placeholder");
                            }

                            await this.renameClusterListItem($("#btn-new-label").data("target"), label);
                            $("#main-modal-dialog").modal("hide");
                        } catch (error) {
                            alert(error.message);
                        }
                    });

                    break;
                default:
                    break;
            }
        });

        $($item).keyup(($event) => {
            const keyboardEvent = <KeyboardEvent>$event.originalEvent;

            if (keyboardEvent.code === "Enter" || keyboardEvent.code === "Space") {
                $($item).click();
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
            await this.sfxContainer.loadSfxAsync(endpoint);
            cluster.currentInView = true;
            await this.settings.setAsync<string>("cluster-list-folders", JSON.stringify(this.clusterListDataModel));
            $target.addClass("current");
        });
    }
}
