import { AuthenticationManager } from "./auth/authenticationManager";
import { IHttpHandler } from "./httpHandler";
import { MainWindow } from "./mainWindow";
import { Subject } from "./observable";
import { SettingsService } from "./settings";

export interface IClusterAuth {
    authType: string;
    certificatePath?: string;
}

export interface IClustherAuthCertificate extends IClusterAuth{
    authType: "certificate",
    certificatePath: string;
    certificatePassword?: string;
}

export interface ICluster {
    name: string;
    url: string;
    id: string;
    authentication: IClusterAuth;
}

export interface ILog {
    timestamp: Date;
    message: string;
}
export interface ILoadedClusterData {
    loaded?: boolean;
    state?: string;
    message?: string;
    log?: ILog[];
}

export interface IloadedCluster extends ICluster {
    data?: ILoadedClusterData;
}


export interface IClusterListState {
    clusters: ICluster[];
    focusedCluster: string;
}

export class ClusterManager {
    private clusters: IloadedCluster[] = [
        {
            id: "1",
            url: "http://localhost:19080",
            name: "Localhost",
            authentication: {
                authType: "unsecure"
            }
        },
    ];

    private loadedClusters = new Set();

    public httpHandlers: Record<string, IHttpHandler> = {};
    public windowToCluster: Record<number, ICluster> = {};

    private focusedCluster: string;

    public observable = new Subject<IClusterListState>();

    constructor(private settings: SettingsService, private mainWindow: MainWindow, private authManager: AuthenticationManager) {
        const existingList = this.settings.getClusters();
        if(existingList) {
            this.clusters = existingList;
        }
    }

    async connectCluster(cluster: IloadedCluster) {
        let setActive = true;

        if(!this.loadedClusters.has(cluster.id)) {
            this.updateClusterData(cluster.id, {loaded: true})

            try {
                this.httpHandlers[cluster.id] = this.authManager.getHttpHandler(cluster.authentication.authType);
                await this.httpHandlers[cluster.id].initialize(cluster);
                const success = await this.httpHandlers[cluster.id].testConnection();
                if(success) {
                    const id = await this.mainWindow.addWindow(cluster);
                    this.windowToCluster[id] = cluster;
        
                    this.loadedClusters.add(cluster.id);
                    this.addClusterLogMessage(cluster.id, "connected");
                }
            } catch(e) {
                setActive = false;
            }
        }
 
        if(setActive) {
            this.setActiveCluster(cluster.id);
        }
    }

    async addCluster(cluster: IloadedCluster) {
        if(!this.getCluster(cluster.id)) {
            const clusters = this.clusters.concat(cluster);
            this.saveData();
            this.clusters = clusters;
        }
    }

    async bulkImport(clusters: ICluster[]) {
        await Promise.all(this.clusters.map(cluster => {
            return this.discconnectCluster(cluster.id);
        }))

        this.clusters = clusters;
        this.saveData();
    }

    async removeCluster(id: string) {
        this.clusters = this.clusters.filter(c => c.id !== id)
        this.saveData();

        this.mainWindow.removeWindow(id);
        this.loadedClusters.delete(id);
    }

    async updateCluster(cluster: ICluster) {
        const index = this.clusters.findIndex(c => c.id === cluster.id);

        this.clusters[index] = cluster;
        this.httpHandlers[cluster.id] = this.authManager.getHttpHandler(cluster.authentication.authType);
        await this.httpHandlers[cluster.id].initialize(cluster);

        this.saveData();
    }

    async reconnectCluster(cluster: ICluster) {
        this.httpHandlers[cluster.id] = this.authManager.getHttpHandler(cluster.authentication.authType);
        await this.httpHandlers[cluster.id].initialize(cluster);

        this.mainWindow.restartWindow(cluster.id);
        this.setActiveCluster(cluster.id);
    }

    
    async discconnectCluster(clusterId: string) {
        this.httpHandlers[clusterId] = null;
        delete this.httpHandlers[clusterId];

        const id = await this.mainWindow.removeWindow(clusterId);
        this.loadedClusters.delete(clusterId);
        this.windowToCluster[id] = null;
        delete this.windowToCluster[id];

        if(this.focusedCluster == clusterId) {
            this.focusedCluster = "unset";
        }
        this.updateClusterData(clusterId, {loaded: false});
        this.addClusterLogMessage(clusterId, "disconnected");
    }


    async setActiveCluster(id: string) {
        this.mainWindow.setActiveWindow(id);
        this.focusedCluster = id;
    }

    async saveData() {
        this.settings.setData('clusters', this.clusters.map(cluster => { return {
            id: cluster.id,
            url: cluster.url,
            name: cluster.name,
            authentication: cluster.authentication
        }}));
    }

    getCluster(id: string) {
        return this.clusters.find(cluster => cluster.id === id);
    }

    updateClusterData(id: string, data: Partial<ILoadedClusterData>) {
        const cluster = this.getCluster(id);

        cluster.data = {...cluster.data, ...data};
        this.emitState();
    }

    addClusterLogMessage(id: string, message: string) {
        const cluster = this.getCluster(id);

        if(!cluster?.data?.log) {
            cluster.data = {...cluster.data, log: []};
        }

        cluster.data.log = [
            {
                timestamp: new Date(),
                message
            }
        ]

        // cluster.data.log.splice(0,0, {
        //     timestamp: new Date(),
        //     message
        // })

        
        this.emitState();
    }

    emitState() {
        this.observable.emit({
            clusters: this.clusters,
            focusedCluster: this.focusedCluster
        })
    }
}