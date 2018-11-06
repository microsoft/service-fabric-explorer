module Sfx {
    export class ImageStore extends DataModelBase<IRawImageStoreContent> {
        public connectionString: string;

        public root: ImageStoreFolder = new ImageStoreFolder();
        public uiFolderDictionary: { [path: string]: ImageStoreFolder } = {};

        public currentFolder: ImageStoreFolder;
        public pathBreadcrumbItems: IStorePathBreadcrumbItem[] = [];

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
            this.expandFolder(this.root.path);

            let manifest = new ClusterManifest(data);
            manifest.refresh().then(() => this.connectionString = manifest.imageStoreConnectionString);
        }

        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawImageStoreContent> {
            return this.copyFolderContentToUI(this.currentFolder.path).then(() => this.data.$q.resolve(null));
        }

        protected expandFolder(path: string): angular.IPromise<void> {
            const folder = this.uiFolderDictionary[path];
            if (!folder) {
                return this.data.$q.resolve();
            }

            return this.copyFolderContentToUI(path).then(() => {
                folder.isExpanded = true;
                this.currentFolder = folder;

                let index = _.findIndex(this.pathBreadcrumbItems, item => item.path === folder.path);
                if (index > -1) {
                    this.pathBreadcrumbItems = this.pathBreadcrumbItems.slice(0, index + 1);
                } else {
                    this.pathBreadcrumbItems.push(<IStorePathBreadcrumbItem>{ path: folder.path, name: folder.displayName });
                }
            });
        }

        protected deleteContent(path: string): angular.IPromise<any> {
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

        private copyFolderContentToUI(path: string): angular.IPromise<void> {
            let folder: ImageStoreFolder = this.uiFolderDictionary[path];

            if (!folder) {
                return this.data.$q.resolve();
            }

            return Utils.getHttpResponseData(this.data.restClient.getImageStoreContent(path)).then(raw => {
                folder.childrenFolders = _.map(raw.StoreFolders, f => {
                    let childFolder = new ImageStoreFolder(f);
                    this.uiFolderDictionary[childFolder.path] = childFolder;

                    return childFolder;
                });

                folder.childrenFiles = _.map(raw.StoreFiles, f => new ImageStoreFile(f));
            });
        }
    }

    export class ImageStoreItem {
        public path: string;
        public displayName: string;
        public isReserved: boolean;
        public displayedSize: string;

        constructor(path: string) {
            this.path = path;

            let pathSegements = ImageStore.chopPath(path);
            this.displayName = _.last(pathSegements);
            this.isReserved = pathSegements[0] === "Store" || pathSegements[0] === "WindowsFabricStore";
        }
    }

    export class ImageStoreFolder extends ImageStoreItem {
        public fileCount: string;
        public isExpanded: boolean = false;
        public childrenFolders: ImageStoreFolder[];
        public childrenFiles: ImageStoreFile[];

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
