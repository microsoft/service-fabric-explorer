//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as $ from "jquery";
import * as Url from "url";
import { ISfxContainer } from "sfx.sfx-view-container";
import { IClusterList } from "sfx.cluster-list";

(async () => {
    $("#btn-connect").click(async () => {
        try {
            const url = Url.parse($("#input-cluster-url").val().toString());
            if (url.protocol !== "http:" && url.protocol !== "https:") {
                alert("The protocol of the cluster url is not supported. Only HTTP and HTTPS are supported.");
                return;
            }

            const endpoint = url.protocol + "//" + url.host;
            const sfx = await sfxModuleManager.getComponentAsync<ISfxContainer>("page-sfx-container");
            await sfx.LoadSfxAsync(endpoint);

            const list = await sfxModuleManager.getComponentAsync<IClusterList>("cluster-list");
            await list.newListItemAsync(endpoint, url.host);

            window.close();

        } catch (error) {
            alert("The cluster url is not in a valid url format.");
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
