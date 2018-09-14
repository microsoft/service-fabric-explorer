//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as $ from "jquery";
import { IClusterList } from "sfx.cluster-list";

(async () => {
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
            
            window.close();
        } catch (error) {
            alert("Error Occured");
        }
    });

    $("#btn-exit").click(() => {
        window.close();
    });
})();
