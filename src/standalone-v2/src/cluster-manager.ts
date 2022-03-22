import { httpHandler } from "./httpHandler";
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
    displayName: string;
    url: string;
    id: string;
    authType: IClusterAuth;
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
            displayName: "Localhost",
            authType: {
                authType: "unsecure"
            }
        },
    ];
    private loadedClusters = new Set();

    public httpHandlers: Record<string, httpHandler> = {};
    public windowToCluster: Record<number, ICluster> = {};

    private focusedCluster: string;

    public observable = new Subject<IClusterListState>();

    constructor(private settings: SettingsService, private mainWindow: MainWindow) {
        const existingList = this.settings.getClusters();
        if(existingList) {
            this.clusters = existingList;
        }
    }

    async addCluster(cluster: IloadedCluster) {
        if(!this.getCluster(cluster.id)) {
            const clusters = this.clusters.concat(cluster);
            this.saveData();
            this.clusters = clusters;
        }

        if(!this.loadedClusters.has(cluster.id)) {
            this.updateClusterData(cluster.id, {loaded: true})

            this.httpHandlers[cluster.id] = new httpHandler(cluster, this);
            await this.httpHandlers[cluster.id].initialize();

            const id = await this.mainWindow.addWindow(cluster);
            this.windowToCluster[id] = cluster;

            this.loadedClusters.add(cluster.id);
        }
 
        this.setActiveCluster(cluster.id);
    }

    async removeCluster(id: string) {
        this.clusters = this.clusters.filter(c => c.id !== id)
        this.saveData();

        this.mainWindow.removeWindow(id);
        this.loadedClusters.delete(id);

        this.emitState();
    }

    async updateCluster(cluster: ICluster) {
        const index = this.clusters.findIndex(c => c.id === cluster.id);

        this.clusters[index] = cluster;
        this.httpHandlers[cluster.id] = new httpHandler(cluster, this);

        this.saveData();
        this.emitState();
    }

    async reconnectCluster(cluster: ICluster) {
        this.httpHandlers[cluster.id] = new httpHandler(cluster, this);
        await this.httpHandlers[cluster.id].initialize();

        this.mainWindow.restartWindow(cluster.id);
        this.setActiveCluster(cluster.id);
    }

    
    async discconnectCluster(cluster: ICluster) {
        this.httpHandlers[cluster.id] = null;
        this.mainWindow.removeWindow(cluster.id);
        this.loadedClusters.delete(cluster.id);
        if(this.focusedCluster == cluster.id) {
            this.focusedCluster = "unset";
        }
        this.updateClusterData(cluster.id, {loaded: false})
        this.emitState();
    }


    async setActiveCluster(id: string) {
        this.mainWindow.setActiveWindow(id);
        this.focusedCluster = id;
        this.emitState();
    }

    async saveData() {
        this.settings.setData('clusters', this.clusters.map(cluster => { return {
            id: cluster.id,
            url: cluster.url,
            displayName: cluster.displayName,
            authType: cluster.authType
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