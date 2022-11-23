import Store from 'electron-store';
import { ICluster } from './cluster-manager';


type StoreType = {
    clusters: ICluster[];
}

export class SettingsService {
    private store = new Store<StoreType>();

    constructor() {

    }

    setData<T>(path: string, data: T) {
        this.store.set(path, data);
    }

    getClusters() {
        return this.store.get<'clusters'>('clusters');
    }
}