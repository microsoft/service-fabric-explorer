import * as $ from "jquery";
// import * as Url from "url";
import { IClusterList } from "sfx.cluster-list";

(async() => {
    $("#btn-delete-folder").click(async () => {
        let folder = localStorage.getItem("folder");
        localStorage.removeItem("folder");
        try{
            console.log("deleting " + folder);
            const list = await sfxModuleManager.getComponentAsync<IClusterList>("cluster-list");
            console.log("deleting " + folder);
            await list.removeFolder(folder);
            console.log("deleting " + folder);
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