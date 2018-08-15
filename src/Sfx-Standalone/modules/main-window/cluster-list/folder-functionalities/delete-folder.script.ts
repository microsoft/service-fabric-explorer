//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as $ from "jquery";
import { IClusterList } from "sfx.cluster-list";

(async() => {
    let folder = localStorage.getItem("folder");
    localStorage.removeItem("folder");

    $(document).ready(() => {
        $(".modal-title").html("Remove Folder " + folder);
        $(".modal").slideDown(150);
    });

    $("#btn-delete-folder").click(async () => {

        try {
            const list = await sfxModuleManager.getComponentAsync<IClusterList>("cluster-list");
            await list.removeFolderItem(folder);
            window.close();

        } catch(error) {
            alert("Error Occured");

        }
    });

    $("#btn-exit").click(() => {
        window.close();
    });
})();
