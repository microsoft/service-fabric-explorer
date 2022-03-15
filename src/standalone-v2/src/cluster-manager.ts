import { httpHandler } from "./httpHandler";
import { MainWindow } from "./mainWindow";
import { Subject } from "./observable";
import { SettingsService } from "./settings";

export interface IClusterAuth {
    authType: "unsecure" | "certificate";
    certificatePath?: string;
}

export interface IClustherAuthCertificate extends IClusterAuth{
    authType: "certificate",
    certificatePath: string;
}

export interface ICluster {
    displayName: string;
    url: string;
    id: string;
    authType: IClusterAuth;
}


export interface IClusterListState {
    clusters: ICluster[];
    focusedCluster: string;
}

export class ClusterManager {
    private clusters: ICluster[] = [
        {
            id: "1",
            url: "http://localhost:19080",
            displayName: "Localhost",
            authType: {
                authType: "unsecure"
            }
        },
        {
            id: "2",
            url: "http://localhost:2500",
            displayName: "Localhost test",
            authType: {
                authType: "unsecure"
            }
        }
    ];
    private loadedClusters = new Set();

    public httpHandlers: Record<string, httpHandler> = {};
    public windowToCluster: Record<number, ICluster> = {};

    private focusedCluster: string;

    public observable = new Subject<IClusterListState>();

    constructor(private settings: SettingsService, private mainWindow: MainWindow) {
        const existingList = this.settings.getClusters();
        if(existingList) {
            // this.clusters = existingList;
        }
    }

    async addCluster(cluster: ICluster) {
        if(!this.getCluster(cluster.id)) {
            const clusters = this.clusters.concat(cluster);
            this.settings.setData('clusters', clusters);
            this.clusters = clusters;
        }

        if(!this.loadedClusters.has(cluster.id)) {
            this.httpHandlers[cluster.id] = new httpHandler(cluster);
            await this.httpHandlers[cluster.id].initialize();

            const id = await this.mainWindow.addWindow(cluster);
            this.windowToCluster[id] = cluster;

            this.loadedClusters.add(cluster.id);
        }
 
        this.setActiveCluster(cluster.id);
    }

    async removeCluster(id: string) {
        this.clusters = this.clusters.filter(c => c.id !== id)
        this.settings.setData('clusters', this.clusters);

        this.mainWindow.removeWindow(id);
        this.loadedClusters.delete(id);

        this.emitState();
    }

    async updateCluster(cluster: ICluster) {
        const index = this.clusters.findIndex(c => c.id === cluster.id);
        //TODO recreate the http handler
        this.clusters[index] = cluster;
        this.settings.setData('clusters', this.clusters);
        this.emitState();
    }

    async reconnectCluster(cluster: ICluster) {
        this.mainWindow.restartWindow(cluster.id);
        this.setActiveCluster(cluster.id);
    }


    async setActiveCluster(id: string) {
        this.mainWindow.setActiveWindow(id);
        this.focusedCluster = id;
        this.emitState();
    }

    getCluster(id: string) {
        return this.clusters.find(cluster => cluster.id === id);
    }

    emitState() {
        this.observable.emit({
            clusters: this.clusters,
            focusedCluster: this.focusedCluster
        })
    }
}