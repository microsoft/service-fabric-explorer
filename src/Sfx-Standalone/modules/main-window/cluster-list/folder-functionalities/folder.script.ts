import * as $ from "jquery";
// import * as Url from "url";
import { IClusterList } from "sfx.cluster-list";
// import { Menu } from "../Model"

(async() => {
   // let menu = Menu.getInstance();
    $("#btn-new-folder").click(async () => {
        try{
            let label: string = $("#input-folder-label").val().toString();
            const list = await sfxModuleManager.getComponentAsync<IClusterList>("cluster-list");
            await list.newFolderItemAsync(label);
            localStorage.setItem("folder_label", label);
            window.close();

        }catch(error){
            alert((<Error>error).message);
        }
    });

    $("#btn-exit").click(() => {
        window.close();
    });
})();