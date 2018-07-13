//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as $ from "jquery";
import { SfxContainer } from "../sfx-container/sfx-container.script";
import { ClusterList } from "./cluster-list.script";

(async () => {
    $("#btn-connect").click(async () => {
        const sfx = await sfxModuleManager.getComponentAsync<SfxContainer>("page-sfx-container");
        await sfx.LoadSfxAsync($("#input-cluster-url").val());

        const list = await sfxModuleManager.getComponentAsync<ClusterList>("cluster-list");
        await list.newListItemAsync($("#input-cluster-url").val());

        window.close();        
    });

    $("#btn-exit").click(() => {
        window.close();        
    });
})();
