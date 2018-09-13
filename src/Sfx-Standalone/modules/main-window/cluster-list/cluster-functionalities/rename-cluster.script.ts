//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as $ from "jquery";
import { IClusterList } from "sfx.cluster-list";


(async () => {
    $("#btn-new-label").click(async (e) => {
        try {
            let label: string = $("#input-cluster-label").val();
            if (label !== "") {
                const list = await sfxModuleManager.getComponentAsync<IClusterList>("cluster-list");
                await list.renameClusterListItem($("#btn-new-label").data("target"), label);

                window.close();
            }
        } catch (error) {
            alert(error.message);
        }
    });

    $("#btn-exit").click(() => {
        window.close();
    });
})();
