import * as $ from "jquery";
// import * as Url from "url";
import { IClusterList } from "sfx.cluster-list";


(async() => {
    $("#btn-new-label").click(async () => {
        try{
            let old_cluster = localStorage.getItem("cluster");
            localStorage.removeItem("cluster");
            let label: string = $("#input-cluster-label").val().toString();
            const list = await sfxModuleManager.getComponentAsync<IClusterList>("cluster-list");
            await list.renameCluster(old_cluster, label);
        
            window.close();

        }catch(error){
            //alert("Folder name is not valid");
            alert(error.message);
        }
    });

    $("#btn-exit").click(() => {
        window.close();
    });
})();