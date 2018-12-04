//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IClusterListDataModel } from "sfx.cluster-list";

export class ClusterListDataModel implements IClusterListDataModel {
    private folders: Array<Folder> = new Array<Folder>();

    constructor() {
        // Root
        this.folders.push(new Folder(""));
    }
    
    public addFolder(label: string) {
        this.folders.push(new Folder(label));
    }

    public addCluster(displayName: string, endpoint: string, folderName?: string) {
        if (!folderName) {
            // Put cluster to root            
            folderName = "";
        }

        const cluster = new Cluster(displayName, endpoint, folderName, true);
        this.getFolder(folderName).clusters.push(cluster);        
    }

    public removeFolder(label: string) {
        for (let cluster of this.getFolder(label).clusters) {
            this.removeCluster(cluster.displayName, label);
        }

        this.folders.splice(this.folders.indexOf(this.getFolder(label)), 1);
    }

    public removeCluster(cluster_label: string, folder_label: string) {
        let folder: Folder = this.getFolder(folder_label);
        let cluster_index = folder.indexOf(this.getCluster(cluster_label, "label"));
        folder.clusters.splice(cluster_index, 1);
    }

    public renameFolder(old_name: string, new_name: string) {
        this.getFolder(old_name).name = new_name;
    }

    public renameCluster(old_name: string, new_name: string) {
        this.getCluster(old_name, "label").displayName = new_name;
    }

    public moveCluster(label: string, new_folder_label: string) {
        let cluster: Cluster = this.getCluster(label, "label");
        let old_folder: Folder = this.getFolder(cluster.folder);
        let new_folder: Folder = this.getFolder(new_folder_label);

        if (new_folder) {
            this.addCluster(cluster.displayName, cluster.endpoint, new_folder.name);
            this.removeCluster(cluster.displayName, old_folder.name);
        } else {
            this.addFolder(new_folder_label);
            new_folder = this.getFolder(new_folder_label);
            this.addCluster(cluster.displayName, cluster.endpoint, new_folder.name);
            this.removeCluster(cluster.displayName, old_folder.name);
        }
    }

    public getFolders(): Array<IFolder> {
        return this.folders;
    }

    public getCluster(label: string, type: string) {
        for (let folder of this.folders) {
            for (let cluster of folder.clusters) {
                if (cluster.displayName.toLowerCase() === label.toLowerCase() && type === "label") {
                    return cluster;
                }
                if (cluster.endpoint.toLowerCase() === label.toLowerCase() && type === "endpoint") {
                    return cluster;
                }
            }
        }

        return null;
    }

    public getFolder(name: string) {
        for (let folder of this.folders) {
            if (folder.name.toLowerCase() === name.toLowerCase()) {
                return folder;
            }
        }

        return null;
    }
}

export interface IFolder {
    name: string;
    clusters: Array<ICluster>;
}

 class Folder implements IFolder {
    clusters: Cluster[] = new Array<Cluster>();

    constructor(public name: string) {
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

export interface ICluster {
    displayName: string;
    endpoint: string;
    folder?: string;
    currentInView: boolean;    
}

class Cluster implements ICluster {
    constructor(public displayName: string, public endpoint: string, public folder?: string, public currentInView: boolean = false) {
    }
}
