import * as $ from "jquery";
import { ClusterList } from "./cluster-list/cluster-list.script";
import { ISettings } from "sfx.settings";

(async () => {
    // sfxModuleManager.register(DialogService.getComponentInfo());
    // sfxModuleManager.register(SfxContainer.getComponentInfo());

    // require("./cluster-list/cluster-list.script.js");
    // require("./cluster-list/model.js");

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

        const settings = await sfxModuleManager.getComponentAsync<ISettings>("settings");
        const clusterListComponent = new ClusterList(settings);
        await clusterListComponent.setupAsync();

    } catch (error) {
        console.log(error);
    }
})();

