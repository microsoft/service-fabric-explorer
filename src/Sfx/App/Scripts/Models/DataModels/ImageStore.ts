module Sfx {
    export class ImageStore extends DataModelBase<IRawImageStoreContent> {
        public static reservedFileName: string = "_.dir";

        public isNative: boolean = false;
        public connectionString: string;
        public root: ImageStoreFolder = new ImageStoreFolder();
        public uiFolderDictionary: { [path: string]: ImageStoreFolder } = {};

        public currentFolder: ImageStoreFolder;
        public pathBreadcrumbItems: IStorePathBreadcrumbItem[] = [];

        private isLoadingFolderContent: boolean = false;

        public static chopPath(path: string): string[] {
            if (path.indexOf("\\") > -1) {
                return path.split("\\");
            }

            return path.split("/");
        }

        constructor(public data: DataService) {
            super(data);
            this.root.path = "";
            this.root.displayName = "Image Store";

            this.uiFolderDictionary[this.root.path] = this.root;
            this.currentFolder = this.root;
            let manifest = new ClusterManifest(data);
            manifest.refresh().then(() => {
                this.connectionString = manifest.imageStoreConnectionString;
                this.isNative = this.connectionString.toLowerCase() === "fabric:imagestore";

                if(this.isNative){
                    this.expandFolder(this.currentFolder.path);
                }
            });

        }

        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawImageStoreContent> {
            if (!this.isNative || this.isLoadingFolderContent) {
                return this.data.$q.resolve(null);
            }
            return this.loadFolderContent(this.currentFolder.path);
        }

        protected updateInternal(): angular.IPromise<any> | void {
            return this.data.$q.when(true);
        }

        protected expandFolder(path: string): angular.IPromise<IRawImageStoreContent> {
            const folder = this.uiFolderDictionary[path];
            if (this.isLoadingFolderContent) {
                return;
            }
            this.isLoadingFolderContent = true;
            return this.loadFolderContent(path).then((raw) => {


                folder.isExpanded = true;
                this.currentFolder = folder;

                let index = _.findIndex(this.pathBreadcrumbItems, item => item.path === folder.path);
                if (index > -1) {
                    this.pathBreadcrumbItems = this.pathBreadcrumbItems.slice(0, index + 1);
                } else {
                    this.pathBreadcrumbItems.push(<IStorePathBreadcrumbItem>{ path: folder.path, name: folder.displayName });
                }

                this.isLoadingFolderContent = false;
                return raw;
            });
        }

        public deleteContent(path: string): angular.IPromise<any> {
            if (!path) {
                return this.data.$q.resolve();
            }

            let item: ImageStoreItem = _.find(this.currentFolder.childrenFolders, folder => folder.path === path);
            if (!item) {
                item = _.find(this.currentFolder.childrenFiles, file => file.path === path);
            }

            if (!item || item.isReserved) {
                return this.data.$q.resolve();
            }

            return Utils.getHttpResponseData(this.data.restClient.deleteImageStoreContent(path)).then(() => this.refresh());
        }

        private loadFolderContent(path: string): angular.IPromise<IRawImageStoreContent> {
            /*
            Currently only used to open up to a different directory/reload currently directory in the refresh interval loop

            Attempt to load that directory and if it recieves a 404, indicating a folder does not exist then attempt to load the base
            directory.

            If the base directory does not exist(really only due to nothing existing in the image store), then load in place of it an 'empty' image store base.

            */
            let folder: ImageStoreFolder = this.uiFolderDictionary[path];

            return this.data.$q( (resolve, reject) => {
                Utils.getHttpResponseData(this.data.restClient.getImageStoreContent(path)).then(raw => {
                    folder.childrenFolders = _.map(raw.StoreFolders, f => {
                        let childFolder = new ImageStoreFolder(f);
                        this.uiFolderDictionary[childFolder.path] = childFolder;

                        return childFolder;
                    });

                    folder.childrenFiles = _.map(raw.StoreFiles, f => new ImageStoreFile(f));
                    folder.allChildren = [].concat(folder.childrenFiles).concat(folder.childrenFolders);
                    resolve(raw);
                }).catch(err => {
                    //The folder to load does not exist anymore, i.e deleted outside of powershell and attempting to refresh
                    //if not the base directory then query for base directory, this is to stop a recurse.
                    if (this.currentFolder.path !== this.root.path) {
                        if (err.status === 404) {
                            this.data.message.showMessage(
                                `Directory ${path} does not appear to exist anymore. Navigating back to the base of the image store directory.`, MessageSeverity.Warn);
                        }
                        // AT BASE DIRECTORY
                        this.currentFolder = this.root;
                        this.expandFolder(this.root.path).then( r => {
                            resolve(r);
                        });
                    } else {
                        //BASE image store directory does not exist.
                        resolve({StoreFiles: [], StoreFolders: []});
                    }
                });
            });
        }
    }

    export class ImageStoreItem {
        public path: string;
        public displayName: string;
        public isReserved: boolean;
        public displayedSize: string;
        public size: number;

        public uniqueId: string;

        constructor(path: string) {
            this.uniqueId = path;
            this.path = path;

            let pathSegements = ImageStore.chopPath(path);
            this.displayName = _.last(pathSegements);
            this.isReserved = pathSegements[0] === "Store" || pathSegements[0] === "WindowsFabricStore" || this.displayName === ImageStore.reservedFileName;
        }
    }

    export class ImageStoreFolder extends ImageStoreItem {
        public fileCount: string;
        public isExpanded: boolean = false;
        public childrenFolders: ImageStoreFolder[];
        public childrenFiles: ImageStoreFile[];
        public allChildren: ImageStoreItem[];

        constructor(raw?: IRawStoreFolder) {
            super(raw ? raw.StoreRelativePath : "");

            if (!raw) {
                return;
            }

            this.path = raw.StoreRelativePath;
            this.fileCount = raw.FileCount;
        }
    }

    export class ImageStoreFile extends ImageStoreItem {
        public version: string;
        public modifiedDate: string;
        public size: number = 0;

        constructor(raw?: IRawStoreFile) {
            super(raw ? raw.StoreRelativePath : "");

            if (!raw) {
                return;
            }

            this.path = raw.StoreRelativePath;
            this.size = Number(raw.FileSize);
            this.displayedSize = Utils.getFriendlyFileSize(this.size);
            this.version = raw.FileVersion ? raw.FileVersion.VersionNumber : "";
            this.modifiedDate = raw.ModifiedDate;
        }
    }

    export interface IStorePathBreadcrumbItem {
        path: string;
        name: string;
    }
}
