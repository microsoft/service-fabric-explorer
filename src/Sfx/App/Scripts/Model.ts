class Folder{
    label: string = "folder";
    clusters: Cluster[] = new Array<Cluster>();
    
    constructor(label: string){
        this.label = label;
    }
    indexOf(cluster: Cluster){
        for(let i = 0; i < this.clusters.length; i++){
            if(this.clusters[i] === cluster) return i;
        }
        return -1;
    }

}

class Cluster{
    label: string;
    url: string;
    folder: string = null;
   
    constructor(label: string, url: string){
        this.label = label;
        this.url = url;
    }
}

class StringMap<T> {
    private items: { [key: string]: T };

    constructor() {
        this.items = {};
    }

    add(key: string, value: T): void {
        this.items[key] = value;
    }

    has(key: string): boolean {
        return key in this.items;
    }

    get(key: string): T {
        return this.items[key];
    }

    remove(key: string): void{
       delete this.items[key];
    }
}
