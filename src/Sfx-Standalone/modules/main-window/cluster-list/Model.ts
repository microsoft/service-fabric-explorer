import { IMenu } from "sfx.menu";


export class Menu implements IMenu {
    private static _instance: Menu;

    private folders: Array<Folder> = new Array<Folder>();

    constructor() {
        this.addFolder("----No Folder----");
    }
    
    public addFolder(label: string) {
        this.folders.push(new Folder(label));
        console.log(label + " folder added");
    }
    public addCluster(label: string, url: string, folder: string) {
        console.log(label + " " + url + " " + folder);
        this.getFolder(folder).clusters.push(new Cluster(label, url, folder));

    }
    public removeFolder(label: string) {
        for (let cluster of this.getFolder(label).clusters) {
            this.removeCluster(cluster.label, label);
        }
        this.folders.splice(this.folders.indexOf(this.getFolder(label)), 1);

    }
    public removeCluster(cluster_label: string, folder_label: string) {
        console.log(cluster_label + " " + folder_label);
        let folder: Folder = this.getFolder(folder_label);
        let cluster_index = folder.indexOf(this.getCluster(cluster_label, "label"));
        console.log(folder.label, cluster_index);
        folder.clusters.splice(cluster_index, 1);
    }
    public renameFolder(old_name: string, new_name: string) {
        this.getFolder(old_name).label = new_name;
    }
    public renameCluster(old_name: string, new_name: string) {
        console.log("renaming" + old_name + new_name);
        this.getCluster(old_name, "label").label = new_name;
    }
    public moveCluster(label: string, new_folder_label: string) {
        let cluster: Cluster = this.getCluster(label, "label");
        let old_folder: Folder = this.getFolder(cluster.folder);
        let new_folder: Folder = this.getFolder(new_folder_label);

        if (new_folder) {
            this.addCluster(cluster.label, cluster.url, new_folder.label);
            this.removeCluster(cluster.label, old_folder.label);
        } else {
            this.addFolder(new_folder_label);
            new_folder = this.getFolder(new_folder_label);
            this.addCluster(cluster.label, cluster.url, new_folder.label);
            this.removeCluster(cluster.label, old_folder.label);
        }
    }

    public folderExists(label: string): boolean {
        return (this.getFolder(label) != null);
    }
    public clusterExists(label: string): boolean {
        return (this.getCluster(label, "label") != null);
    }

    public getFolders(): Array<Folder> {
        return this.folders;
    }


    public static getInstance(): Menu {
        if (this._instance === null || this._instance === undefined) {
            this._instance = new Menu();
        }
        return this._instance;
    }



    public getCluster(label: string, type: string) {
        for (let folder of this.folders) {
            for (let cluster of folder.clusters) {
                if (cluster.label === label && type === "label") {
                    return cluster;
                }
                if (cluster.url === label && type === "endpoint") {
                    return cluster;
                }
            }
        }

        return null;
    }

    public getFolder(label: string) {
        for (let folder of this.folders) {
            if (folder.label === label) {
                console.log("Found Folder");
                return folder;
            }
        }
        return null;
    }
}



export class Folder {
    label: string = "folder";
    clusters: Cluster[] = new Array<Cluster>();
    constructor(label: string) {
        this.label = label;
    }
    indexOf(cluster: Cluster) {
        for (let i = 0; i < this.clusters.length; i++) {
            if (this.clusters[i] === cluster) {
                return i;
            }
        }
        return -1;
    }
}

class Cluster {
    label: string;
    url: string;
    folder: string = null;

    constructor(label: string, url: string, folder: string) {
        this.label = label;
        this.url = url;
        this.folder = folder;
    }
}

// class StringMap<T> {
//     private items: { [key: string]: T };

//     constructor() {
//         this.items = {};
//     }

//     add(key: string, value: T): void {
//         this.items[key] = value;
//     }

//     has(key: string): boolean {
//         return key in this.items;
//     }

//     get(key: string): T {
//         return this.items[key];
//     }

//     remove(key: string): void {
//        delete this.items[key];
//     }
// }
