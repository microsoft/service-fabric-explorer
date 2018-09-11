//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IClusterListDataModel } from "sfx.cluster-list";

export class ClusterListDataModel implements IClusterListDataModel {

    private folders: Array<Folder> = new Array<Folder>();

    public addFolder(label: string) {
        this.folders.push(new Folder(label));
    }

    public addCluster(label: string, url: string, folder: string) {
        this.getFolder(folder).clusters.push(new Cluster(label, url, folder));
    }

    public removeFolder(label: string) {
        for (let cluster of this.getFolder(label).clusters) {
            this.removeCluster(cluster.label, label);
        }

        this.folders.splice(this.folders.indexOf(this.getFolder(label)), 1);
    }

    public removeCluster(cluster_label: string, folder_label: string) {
        let folder: Folder = this.getFolder(folder_label);
        let cluster_index = folder.indexOf(this.getCluster(cluster_label, "label"));
        folder.clusters.splice(cluster_index, 1);
    }

    public renameFolder(old_name: string, new_name: string) {
        this.getFolder(old_name).label = new_name;
    }

    public renameCluster(old_name: string, new_name: string) {
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

    public getCluster(label: string, type: string) {
        for (let folder of this.folders) {
            for (let cluster of folder.clusters) {
                if (cluster.label.toLowerCase() === label.toLowerCase() && type === "label") {
                    return cluster;
                }
                if (cluster.url.toLowerCase() === label.toLowerCase() && type === "endpoint") {
                    return cluster;
                }
            }
        }

        return null;
    }

    public getFolder(label: string) {
        for (let folder of this.folders) {
            if (folder.label.toLowerCase() === label.toLowerCase()) {
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
