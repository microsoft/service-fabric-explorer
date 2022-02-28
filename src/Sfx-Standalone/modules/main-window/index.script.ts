import * as $ from "jquery";
import { ClusterList } from "./cluster-list/cluster-list.script";
import { ISettings } from "sfx.settings";
import { IHttpClient } from "sfx.http";
import { IMainWindow } from "sfx.main-window";

(async () => {
    console.log(window)
    const leftpanel = $("div#left-panel");

    try {       

        $("div.sub-panel").hide();
        $("div.sub-panel:first").show();

        $(".btn-component-head").click((e) => {
            const $button = $(e.target);
            const $subPanel = $(`#sub-${$button.data("component")}`);
            if ($subPanel.css("display") !== "none") {
                return;
            }

            $("div.sub-panel").hide("slow");
            $subPanel.show("slow");
        });

        $("#sidebar-collapse-button").click((e) => {
            const button = $(e.target);
            if (leftpanel.attr("aria-expanded") === "true") {
                leftpanel.attr("aria-expanded", "false");
                leftpanel.addClass("left-nav-collapsed");
                button.removeClass("bowtie-chevron-left-all");
                button.addClass("bowtie-chevron-right-all");
            } else {
                leftpanel.attr("aria-expanded", "true");
                leftpanel.removeClass("left-nav-collapsed");
                button.removeClass("bowtie-chevron-right-all");
                button.addClass("bowtie-chevron-left-all");
            }
        });

        const settings = await sfxModuleManager.getComponentAsync<ISettings>("settings.default");
        const http = await sfxModuleManager.getComponentAsync<IHttpClient>("http.http-client.service-fabric");
        const mw = await sfxModuleManager.getComponentAsync<IMainWindow>("sfx.main-window");
        const clusterListComponent = new ClusterList(settings, http, mw);
        await clusterListComponent.setupAsync();

    } catch (error) {
        console.log(error);
    }
})();

