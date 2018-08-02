import * as $ from "jquery";
// import * as Url from "url";
import { IClusterList } from "sfx.cluster-list";


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


(async() => {

    $("#input-select-folder").change(async () => {
        let folder: string = $("#input-select-folder").val().toString();
        if(folder === "new_folder"){
            $("#new_folder").css("visibility", "visible");
        }
        else{
            $("#new_folder").css("visibility", "hidden");
        }
    });

    $("#btn-move-cluster").click(async () => {
        
        try{
            let cluster = localStorage.getItem("cluster");
            //let url = localStorage.getItem("url");
            localStorage.removeItem("cluster");
            //localStorage.removeItem("url");
            let folder: string = $("#input-select-folder").val().toString();
            let new_folder:string = $("#new-folder-label").val().toString();
            const list = await sfxModuleManager.getComponentAsync<IClusterList>("cluster-list");
            if(new_folder){
                await list.newFolderItemAsync(new_folder);
                await list.moveCluster(cluster, new_folder);
            }
            else{
                await list.moveCluster(cluster, folder);
            }
            console.log("moving " + cluster);
            
            window.close();

        }catch(error){
            alert("Error Occured");

        }
        return false;
    });

    $("#btn-exit").click(() => {
        window.close();
    });
})();