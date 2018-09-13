//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as $ from "jquery";
import * as Url from "url";
import { ISfxContainer } from "sfx.sfx-view-container";
import { IClusterList } from "sfx.cluster-list";

(async () => {
    const list = await sfxModuleManager.getComponentAsync<IClusterList>("cluster-list");
    const folders = await (await list.getDataModel()).getFolders();
    let select = $("#input-select-folder");

    console.log(await folders.length);
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
           
            await (await sfxModuleManager.getComponentAsync<IClusterList>("cluster-list")).newClusterListItemAsync(endpoint, name, folder);            
            await (await sfxModuleManager.getComponentAsync<ISfxContainer>("page-sfx-container")).loadSfxAsync(endpoint).then(() => {
                window.close();
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
            $("#input-cluster-url").val("http://localhost:19080");
        }

        $("#input-cluster-url").prop("disabled", $sender.prop("checked"));
    });

    $("#btn-exit").click(() => {
        window.close();
    });
})();
