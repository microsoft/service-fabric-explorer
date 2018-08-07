//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as $ from "jquery";
import * as Url from "url";
import { ISfxContainer } from "sfx.sfx-view-container";
import { IClusterList } from "sfx.cluster-list";
// import { Folder } from "./Model"

// import { AsyncResource } from "async_hooks";

$(document).ready(() => {
    let folders = JSON.parse(localStorage.getItem("folders"));
    localStorage.removeItem("folders");
    console.log(folders);
    let select = $("#input-select-folder");
    for(let folder of folders){
        let $item = $(`<option value="${folder.label}">${folder.label}</option>`);
        select.append($item);
    }
    let $item = $(`<option value="new_folder">Create New Folder</option>`);
    select.append($item);
});


(async () => {
    $("#input-select-folder").change(async () => {
        let folder: string = $("#input-select-folder").val().toString();
        if(folder === "new_folder"){
            $("#new_folder").css("visibility", "visible");

        }
        else{
            $("#new_folder").css("visibility", "hidden");
        }
    });

   
    $("#btn-connect").click(async () => {
        try {
            
            const url = Url.parse($("#input-cluster-url").val().toString());
            let name: string = $("#input-cluster-label").val().toString();
            let folder: string = $("#input-select-folder").val().toString();
            let new_folder:string = $("#new-folder-label").val().toString();
           
            if (url.protocol !== "http:" && url.protocol !== "https:") {
                throw new Error("The protocol of the cluster url is not supported. Only HTTP and HTTPS are supported.");
            }
           
            const endpoint = url.protocol + "//" + url.host;
            console.log(endpoint + " " + name);
            if(!name) {
                name = url.host;
            }
            

            const list = await sfxModuleManager.getComponentAsync<IClusterList>("cluster-list");
            console.log(endpoint + " " + name);

            if(folder != "----No Folder----"){
                if(folder === "new_folder"){
                    if(!new_folder) {
                        throw new Error("Folder must have name!");
                    }
                    await list.newListItemAsync(endpoint, name, new_folder);
                }
                else{
                    await list.newListItemAsync(endpoint, name, folder);
                }
            }
            else{
                await list.newListItemAsync(endpoint, name, folder);
            }

            console.log(endpoint + " " + name);
            const sfx = await sfxModuleManager.getComponentAsync<ISfxContainer>("page-sfx-container");
            await sfx.LoadSfxAsync(endpoint).then(() => {
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
