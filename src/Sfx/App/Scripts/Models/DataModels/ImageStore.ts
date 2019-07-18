module Sfx {
    export class ImageStore extends DataModelBase<IRawImageStoreContent> {
        public static reservedFileName: string = "_.dir";

        //These start as true to not display prematurely while loading correct state.
        public isAvailable: boolean = true;
        public isNative: boolean = true;
        public connectionString: string;
        public root: ImageStoreFolder = new ImageStoreFolder();
        public cachedCurrentDirectoryFolderSizes: { [path: string]: {size: number, loading: boolean, date?: Date } } = {};

        public currentFolder: ImageStoreFolder;
        public pathBreadcrumbItems: IStorePathBreadcrumbItem[] = [];

        private isLoadingFolderContent: boolean = false;
        private initialized = false;

        //helper to determine which way for slashes to be added in.
        public static slashDirection(path: string): boolean {
            return path.indexOf("\\") > -1;
        }

        public static chopPath(path: string): string[] {
            if (ImageStore.slashDirection(path)) {
                return path.split("\\");
            }

            return path.split("/");
        }

        constructor(public data: DataService) {
            super(data);
            this.root.path = "";
            this.root.displayName = "Image Store";

            this.currentFolder = this.root;
            this.pathBreadcrumbItems = [<IStorePathBreadcrumbItem>{ path: this.root.path, name: this.root.displayName}];

            let manifest = new ClusterManifest(data);
            manifest.refresh().then(() => {
                this.connectionString = manifest.imageStoreConnectionString;
                this.isNative = this.connectionString.toLowerCase() === "fabric:imagestore";

                if (this.isNative) {
                        // if we get an actual request error. i.e a 400 that means this cluster does not have the API
                        this.expandFolder(this.currentFolder.path).then( () => {
                            this.isAvailable = true;
                        }).catch( err => {
                            this.isAvailable = false;
                        }).finally( () => {
                        this.initialized = true;
                    });
                }
            });

        }

        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawImageStoreContent> {
            if (!this.isNative || this.isLoadingFolderContent || !this.initialized) {
                return this.data.$q.resolve(null);
            }
            return this.expandFolder(this.currentFolder.path);
        }

        protected updateInternal(): angular.IPromise<any> | void {
            return this.data.$q.when(true);
        }

        protected expandFolder(path: string, clearCache: boolean = false): angular.IPromise<IRawImageStoreContent> {
            if (this.isLoadingFolderContent) {
                return;
            }
            this.isLoadingFolderContent = true;
            return this.loadFolderContent(path).then((raw) => {
                this.setCurrentFolder(path, raw, clearCache);

                let index = _.findIndex(this.pathBreadcrumbItems, item => item.path === this.currentFolder.path);
                if (index > -1) {
                    this.pathBreadcrumbItems = this.pathBreadcrumbItems.slice(0, index + 1);
                } else {
                    this.pathBreadcrumbItems.push(<IStorePathBreadcrumbItem>{ path: this.currentFolder.path, name: this.currentFolder.displayName });
                }

                this.isLoadingFolderContent = false;
                return raw;
            }).catch( err => {
                this.isLoadingFolderContent = false;
                if (err.status === 400) {
                    return err;
                }else if (err.status === 404) {
                    this.data.message.showMessage(
                        `Directory ${path} does not appear to exist anymore. Navigating back to the base of the image store directory.`, MessageSeverity.Warn);
                    //go to the base directory
                    return this.expandFolder(this.root.path);
                }
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

        public getCachedFolderSize(path: string): {size: number, loading: boolean } {
            let cachedData = this.cachedCurrentDirectoryFolderSizes[path];
            if (!cachedData) {
                cachedData = {size: -1, loading: false};
                this.cachedCurrentDirectoryFolderSizes[path] = cachedData;
            }
            return cachedData;
        }

        public getFolderSize(path: string): angular.IPromise<IRawStoreFolderSize> {
            return Utils.getHttpResponseData(this.data.restClient.getImageStoreFolderSize(path)).then(raw => {
                return raw;
            });
        }

        private setCurrentFolder(path: string, content: IRawImageStoreContent, clearFolderSizeCache: boolean): void {
            if (clearFolderSizeCache) {
                this.cachedCurrentDirectoryFolderSizes = {};
            }
            let folder: ImageStoreFolder = new ImageStoreFolder();
            folder.path = path;
            let pathSegements = ImageStore.chopPath(path);
            folder.displayName = _.last(pathSegements);

            folder.childrenFolders = _.map(content.StoreFolders, f => {
                let childFolder = new ImageStoreFolder(f);
                if (childFolder.path in this.cachedCurrentDirectoryFolderSizes) {
                    childFolder.size = this.cachedCurrentDirectoryFolderSizes[childFolder.path].size;
                }

                return childFolder;
            });

            folder.childrenFiles = _.map(content.StoreFiles, f => new ImageStoreFile(f));
            folder.allChildren = [].concat(folder.childrenFiles).concat(folder.childrenFolders);
            folder.fileCount = folder.childrenFiles.length;

            this.currentFolder = folder;
        }

        private loadFolderContent(path: string, refresh: boolean = false): angular.IPromise<IRawImageStoreContent> {
            /*
            Currently only used to open up to a different directory/reload currently directory in the refresh interval loop

            Attempt to load that directory and if it recieves a 404, indicating a folder does not exist then attempt to load the base
            directory.

            If the base directory does not exist(really only due to nothing existing in the image store), then load in place of it an 'empty' image store base.

            */

            return this.data.$q( (resolve, reject) => {
                Utils.getHttpResponseData(this.data.restClient.getImageStoreContent(path)).then(raw => {
                    if (refresh) {
                        this.setCurrentFolder(path, raw, false);
                    }
                    resolve(raw);
                }).catch(err => {
                    //handle bug if root directory does not exist.
                    if (err.status === 404 && path === this.root.path) {
                        resolve({StoreFiles: [], StoreFolders: []});
                    }else {
                        reject(err);
                    }
                });
            });
        }
    }

    export class ImageStoreItem {
        //Used for name based sorting in the table
        public isFolder: number;

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
        public isFolder: number = -1;
        public size: number = -1; //setting to -1 for sorting
        public fileCount: number;
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
            this.fileCount = +raw.FileCount;
        }
    }

    export class ImageStoreFile extends ImageStoreItem {
        public isFolder: number = 1;

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
