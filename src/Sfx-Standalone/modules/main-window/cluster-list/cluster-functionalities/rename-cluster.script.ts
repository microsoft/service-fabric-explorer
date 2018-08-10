//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as $ from "jquery";
import { IClusterList } from "sfx.cluster-list";


(async() => {
    let old_cluster = localStorage.getItem("cluster");
    localStorage.removeItem("cluster");

    $(document).ready(() => {
        $(".modal-title").html("Rename Cluster " + old_cluster);
    });
    $("#btn-new-label").click(async () => {
        try{
            
            let label: string = $("#input-cluster-label").val().toString();
            const list = await sfxModuleManager.getComponentAsync<IClusterList>("cluster-list");
            await list.renameClusterListItem(old_cluster, label);
        
            window.close();

        }catch(error){
            alert(error.message);
        }
    });

    $("#btn-exit").click(() => {
        window.close();
    });
})();