//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as $ from "jquery";
import { IClusterList } from "sfx.cluster-list";

(async() => {
    let cluster = localStorage.getItem("cluster");
    localStorage.removeItem("cluster");

    $(document).ready(() => {
        $(".modal-title").html("Delete Cluster " + cluster);
    });

    $("#btn-delete-cluster").click(async () => {
        
        try{
            const list = await sfxModuleManager.getComponentAsync<IClusterList>("cluster-list");
            await list.removeClusterListItem(cluster);
            window.close();

        }catch(error){
            alert("Error Occured");

        }

    });


    $("#btn-exit").click(() => {
        window.close();
    });
})();