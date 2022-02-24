//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as $ from "jquery";
import * as Url from "url";
import * as electron from 'electron';
import { IClusterList, IClusterListDataModel } from "sfx.cluster-list";
import { IDialogService, IDialogFooterButtonOption } from "sfx.main-window";
import { ClusterListDataModel } from "./data-model";
import { ISettings } from "sfx.settings";
import { DialogService } from "../dialog-service/dialog-service";
import { SfxContainer } from "./../sfx-container/sfx-container";
import { IHttpClient } from "sfx.http";

export class ClusterList implements IClusterList {
    private clusterListDataModel: ClusterListDataModel;
    private endpoints: string[] = [];
    private settings: ISettings;
    private http: IHttpClient;
    private dialogService: IDialogService;
    private sfxContainer: SfxContainer;

    public static getComponentInfo(): Donuts.Modularity.IComponentInfo<ClusterList> {
        return {
            name: "cluster-list",
            version: electron.app.getVersion(),
            singleton: true,
            descriptor: async (settings: ISettings, http: IHttpClient) => new ClusterList(settings, http),
            deps: ["sfx.settings", "sfx.http"]
        };
    }

    private static encodeHtml(str) {
        return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    constructor(settings: ISettings, http: IHttpClient) {
        this.settings = settings;
        this.http = http;
        this.parseSettings();

        this.dialogService = new DialogService();
        this.sfxContainer = new SfxContainer(this.http);
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
                    <button tabindex="0" class="mif-more-vert collapsed-hidden flat-button" style="padding: 0px"></button>
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

            //TODO FIX
            this.clusterListDataModel.addCluster(displayName, endpoint, null,folder);
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

            const prompt = await sfxModuleManager.getComponentAsync("prompt.add-cluster");
            const data = await prompt.openAsync()
            
            await this.newClusterListItemAsync(data.endpoint, data.name, "", true);
            await this.sfxContainer.loadSfxAsync(data)

            $("#main-modal-dialog").modal("hide");
            
            console.log(data);
        });

        return Promise.resolve();
    }

    private async parseSettings() {
        const res = await this.settings.getAsync<string>("cluster-list-folders");

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

    }

    private async setupClusterListItemHandler($item, endpoint: string, name: string) {
        $("button.mif-more-vert", $item).click(async (e) => {
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
                            <IDialogFooterButtonOption>{ text: "Remove", type: "submit", cssClass: "solid-button blue", id: "btn-delete-cluster", attributes: { "data-target": `${name}` } },
                            <IDialogFooterButtonOption>{ text: "Cancel", type: "button", cssClass: "flat-button" }
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
                            <IDialogFooterButtonOption>{ text: "Rename", type: "submit", cssClass: "solid-button blue", id: "btn-new-label", attributes: { "data-target": `${name}` } },
                            <IDialogFooterButtonOption>{ text: "Cancel", type: "button", cssClass: "flat-button" }
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
