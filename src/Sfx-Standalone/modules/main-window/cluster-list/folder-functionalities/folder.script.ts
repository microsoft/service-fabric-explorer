//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as $ from "jquery";
import { IClusterList } from "sfx.cluster-list";


(async() => {
    $(document).ready(() => {
        $(".modal").slideDown(150);
    });

    $("#btn-new-folder").click(async () => {
        try {
            let label: string = $("#input-folder-label").val().toString();
            const list = await sfxModuleManager.getComponentAsync<IClusterList>("cluster-list");
            await list.newFolderItemAsync(label);
            localStorage.setItem("folder_label", label);
            window.close();

        } catch(error) {
            alert((<Error>error).message);
        }
    });

    $("#btn-exit").click(() => {
        window.close();
    });
})();
