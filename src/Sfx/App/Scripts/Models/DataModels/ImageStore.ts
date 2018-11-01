module Sfx {
    export class ImageStore extends DataModelBase<IRawImageStoreContent> {
        public connectionString: string;

        public root: ImageStoreFolder = new ImageStoreFolder();
        public dataTreeRoot: FolderDataModel = new FolderDataModel(<IRawStoreFolder>{ StoreRelativePath: "" });
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

            return this.getFolderContentFromDataSource(path).then(folderDataModel => {
                folder.childrenFolders = _.map(folderDataModel.folders, f => {
                    let childFolder = new ImageStoreFolder(f);
                    this.uiFolderDictionary[childFolder.path] = childFolder;

                    return childFolder;
                });

                folder.childrenFiles = _.map(folderDataModel.files, f => new ImageStoreFile(f));
            });
        }

        private getFolderContentFromDataSource(path: string): angular.IPromise<FolderDataModel> {
            return Utils.getHttpResponseData(this.data.restClient.getImageStoreContent(path)).then(rawStoreContent => {
                let folder = new FolderDataModel();
                folder.folders = _.map(rawStoreContent.StoreFolders, f => new FolderDataModel(f));
                folder.files = _.map(rawStoreContent.StoreFiles, f => new FileDataModel(f));

                return folder;
            });
        }
    }

    class StoreItemDataModel {
        public path: string;
        public size: number = 0;
    }

    class FolderDataModel extends StoreItemDataModel {
        public fileCount: string;
        public files: FileDataModel[];
        public folders: FolderDataModel[];

        constructor(raw?: IRawStoreFolder) {
            super();

            if (!raw) {
                return;
            }

            this.path = raw.StoreRelativePath;
            this.fileCount = raw.FileCount;
        }
    }

    class FileDataModel extends StoreItemDataModel {
        public version: string;
        public modifiedDate: string;

        constructor(raw?: IRawStoreFile) {
            super();

            if (!raw) {
                return;
            }

            this.path = raw.StoreRelativePath;
            this.size = Number(raw.FileSize);
            this.version = raw.FileVersion ? raw.FileVersion.VersionNumber : "";
            this.modifiedDate = raw.ModifiedDate;
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

        constructor(dataModel?: FolderDataModel) {
            super(dataModel ? dataModel.path : "");

            if (!dataModel) {
                return;
            }

            this.path = dataModel.path;
            this.fileCount = dataModel.fileCount;
            this.displayedSize = Utils.getFriendlyFileSize(dataModel.size);
        }
    }

    export class ImageStoreFile extends ImageStoreItem {
        public version: string;
        public modifiedDate: string;

        constructor(dataModel?: FileDataModel) {
            super(dataModel ? dataModel.path : "");

            if (!dataModel) {
                return;
            }

            this.displayedSize = Utils.getFriendlyFileSize(dataModel.size);
            this.modifiedDate = dataModel.modifiedDate;
            this.version = dataModel.version;
        }
    }

    export interface IStorePathBreadcrumbItem {
        path: string;
        name: string;
    }
}
