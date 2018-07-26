import * as $ from "jquery";
import * as Url from "url";
import { IClusterList } from "sfx.cluster-list";
import { Menu } from "./Model"

(async() => {
    let menu = Menu.getInstance();
    $("#btn-new-folder").click(async () => {
        try{
            let label: string = $("#input-folder-label").val().toString();
            if(!label){
                alert("Must enter a name!");
                return;
            }
            else if(menu.folderExists(label)){
                alert("Folder already exists");
                return;
            }
            const list = await sfxModuleManager.getComponentAsync<IClusterList>("cluster-list");
            await list.newFolderItemAsync(label);
            window.close();

        }catch(error){
            alert("Folder name is not valid")
        }
    });
})();