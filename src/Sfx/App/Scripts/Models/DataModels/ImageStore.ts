module Sfx {
    export class ImageStore extends DataModelBase<IRawImageStoreContent> {

        public noOfApplicationPackages: number = 0;
        public noOfApplicationTypes: number = 0;
        public sizeOfAppPackages: string = "";
        public sizeOfAppTypes: string = "";
        public root: ImageStoreFolder = new ImageStoreFolder();
        public dataTreeRoot: FolderDataModel = new FolderDataModel(<IRawStoreFolder>{ StoreRelativePath: "" });
        public uiFolderDictionary: { [path: string]: ImageStoreFolder } = {};
        public dataFolderDictionary: { [path: string]: FolderDataModel } = {};

        public openedFolderPathes: string[] = [];
        public relevantFolders: ImageStoreFolder[] = [];
        public relevantFiles: ImageStoreFile[] = [];

        private isFullyLoaded: boolean = false;
        private loadingFullTreePromise: angular.IPromise<any>;

        public static getDisplayName(fullPath: string) {
            const segments = fullPath.split("\\");
            if (segments.length === 1) {
                return fullPath;
            }

            return segments[segments.length - 1];
        }

        constructor(public data: DataService) {
            super(data);

            this.root.path = "";
            this.root.displayName = "root";
            this.root.indentationLevel = -1;

            this.uiFolderDictionary[this.root.path] = this.root;
            this.expandFolder(this.root.path);
        }

        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawImageStoreContent> {
            if (!this.isFullyLoaded && !this.isLoadingFullTree) {
                this.refreshWholeTree();
            }

            return this.data.$q.resolve(null);
        }

        protected refreshWholeTree(): angular.IPromise<any> {
            return this.getCompleteDataSet().then(() => {
                _.each(this.openedFolderPathes, folderPath => {
                    let viewModel = this.uiFolderDictionary[folderPath];
                    let dataModel = this.dataFolderDictionary[folderPath];

                    if (viewModel && dataModel) {
                        viewModel.displayedSize = Utils.getFriendlyFileSize(dataModel.size);
                        _.each(viewModel.childrenFolders,
                            childFolder => {
                                dataModel = this.dataFolderDictionary[childFolder.path];
                                if (dataModel) {
                                    childFolder.displayedSize = Utils.getFriendlyFileSize(dataModel.size);
                                }
                            });
                    }
                });

                return this.data.$q.all([
                    this.getApplicationPackages().then((packages) => {
                        this.noOfApplicationPackages = packages.length;
                        let spaceSize = 0;
                        for (let i = 0; i < packages.length; i++) {
                            let folder = this.getFolderDataModelByPath(packages[i].Name.replace("fabric:/", ""));
                            if (folder) {
                                spaceSize = spaceSize + folder.size;
                            }
                        }

                        this.sizeOfAppPackages = Utils.getFriendlyFileSize(spaceSize);
                    }),
                    this.getApplicationTypes().then((appTypes) => {
                        this.noOfApplicationTypes = appTypes.length;
                        let spaceSize = 0;
                        for (let j = 0; j < appTypes.length; j++) {
                            let folder = this.getFolderDataModelByPath("Store\\" + appTypes[j].Name);
                            if (folder) {
                                spaceSize = spaceSize + folder.size;
                            }
                        }

                        this.sizeOfAppTypes = Utils.getFriendlyFileSize(spaceSize);
                    })]);
            });
        }

        protected expandFolder(path: string): angular.IPromise<void> {
            const folder = this.uiFolderDictionary[path];
            if (!folder) {
                return this.data.$q.resolve();
            }

            return this.copyFolderContentToUI(path).then(() => {
                folder.isExpanded = true;

                if (folder.childrenFiles) {
                    folder.childrenFiles.forEach(f => f.show = true);
                }

                if (folder.childrenFolders) {
                    folder.childrenFolders.forEach(f => f.show = true);
                }

                this.openedFolderPathes.push(path);
            });
        }

        protected closeFolder(path: string) {
            const folder = this.uiFolderDictionary[path];
            if (!folder) {
                return;
            }

            folder.isExpanded = false;
            if (folder.childrenFiles) {
                folder.childrenFiles.forEach(f => f.show = false);
            }

            if (folder.childrenFolders) {
                folder.childrenFolders.forEach(f => { this.closeFolder(f.path); f.show = false; });
            }

            this.openedFolderPathes.splice(this.openedFolderPathes.indexOf(path), 1);
        }

        protected get isLoadingFullTree(): boolean {
            return !!this.loadingFullTreePromise;
        }

        protected getCompleteDataSet(): angular.IPromise<IRawImageStoreContent> {
            if (this.isFullyLoaded) {
                return this.data.$q.resolve(null);
            }

            if (!this.loadingFullTreePromise) {
                this.loadingFullTreePromise = Utils.getHttpResponseData(this.data.restClient.getImageStoreContent()).then<IRawImageStoreContent>(raw => {
                    let tasks: angular.IPromise<IRawImageStoreContent>[] = [];

                    if (!this.dataTreeRoot.files || !this.dataTreeRoot.folders) {
                        this.dataTreeRoot.files = _.map(raw.StoreFiles, f => { return new FileDataModel(f); });
                        this.dataTreeRoot.folders = _.map(raw.StoreFolders, f => { return new FolderDataModel(f); });
                    }

                    for (let i = 0; i < this.dataTreeRoot.folders.length; i++) {
                        tasks.push(this.getFolderContent(this.dataTreeRoot.folders[i], this.dataTreeRoot.folders[i].path));
                    }

                    return this.data.$q.all(tasks).then(t => {
                        let size: number = 0;
                        _.each(this.dataTreeRoot.files, file => size = size + file.size);
                        _.each(this.dataTreeRoot.folders, folder => size = size + folder.size);

                        this.dataTreeRoot.size = size;
                        this.dataFolderDictionary[""] = this.dataTreeRoot;

                        this.isFullyLoaded = true;
                        return raw;
                    });
                }).then(() => {
                    return this;
                }).finally(() => {
                    this.loadingFullTreePromise = null;
                });
            }

            return this.loadingFullTreePromise;
        }

        protected getFolderContent(currentFolder: FolderDataModel, path: string, messageHandler?: IResponseMessageHandler): angular.IPromise<IRawImageStoreContent> {
            return Utils.getHttpResponseData(this.data.restClient.getImageStoreContent(path)).then<IRawImageStoreContent>(raw => {
                currentFolder.files = _.map(raw.StoreFiles, f => { return new FileDataModel(f); });
                currentFolder.folders = _.map(raw.StoreFolders, f => { return new FolderDataModel(f); });

                let tasks: angular.IPromise<IRawImageStoreContent>[] = [];
                for (let i = 0; i < currentFolder.folders.length; i++) {
                    tasks.push(this.getFolderContent(currentFolder.folders[i], currentFolder.folders[i].path));
                }

                return this.data.$q.all(tasks).then(() => {
                    let size: number = 0;
                    _.each(currentFolder.files, file => size = size + file.size);
                    _.each(currentFolder.folders, folder => size = size + folder.size);

                    currentFolder.size = size;
                    this.dataFolderDictionary[currentFolder.path] = currentFolder;

                    return raw;
                });
            });
        }

        protected deleteContent(path: string): angular.IPromise<any> {
            if (!path) {
                return this.data.$q.resolve();
            }

            if (this.uiFolderDictionary[path]) {
                this.uiFolderDictionary[path].show = false;
                delete this.uiFolderDictionary[path];
                delete this.dataFolderDictionary[path];
            } else {
                let folder = this.uiFolderDictionary[path.substring(0, path.lastIndexOf("\\"))];
                let index = _.findIndex(folder.childrenFiles, f => f.path === path);
                if (index >= 0) {
                    folder.childrenFiles.splice(index, 1);
                }

                let dataFolder = this.dataFolderDictionary[path.substring(0, path.lastIndexOf("\\"))];
                index = _.findIndex(dataFolder.files, f => f.path === path);
                if (index >= 0) {
                    dataFolder.files.splice(index, 1);
                }

            }

            return Utils.getHttpResponseData(this.data.restClient.deleteImageStoreContent(path));
        }

        protected search(searchTerm: string): angular.IPromise<void> {
            if (!searchTerm) {
                return this.data.$q.resolve();
            }

            searchTerm = searchTerm.toLocaleLowerCase();
            return this.getCompleteDataSet().then(() => {
                let folderResults: FolderDataModel[] = [];
                let fileResults: FileDataModel[] = [];
                this.recursivelySearch(searchTerm, this.dataTreeRoot, folderResults, fileResults);

                this.relevantFolders = _.map(folderResults, folder => new ImageStoreFolder(folder));
                this.relevantFiles = _.map(fileResults, file => new ImageStoreFile(file));
            });
        }

        private copyFolderContentToUI(path: string): angular.IPromise<void> {
            let folder: ImageStoreFolder = this.uiFolderDictionary[path];

            if (!folder) {
                return this.data.$q.resolve();
            }

            return this.getFolderContentFromLocalDataSource(path).then(folderDataModel => {
                folder.childrenFolders = _.map(folderDataModel.folders, f => {
                    let childFolder = new ImageStoreFolder(f, folder.indentationLevel + 1);
                    this.uiFolderDictionary[childFolder.path] = childFolder;

                    return childFolder;
                });

                folder.childrenFiles = _.map(folderDataModel.files, f => new ImageStoreFile(f, folder.indentationLevel + 1));
            });
        }

        private getFolderContentFromLocalDataSource(path: string): angular.IPromise<FolderDataModel> {
            if (!this.dataFolderDictionary[path]) {
                return Utils.getHttpResponseData(this.data.restClient.getImageStoreContent(path)).then(rawStoreContent => {
                    let folder = new FolderDataModel();
                    folder.folders = _.map(rawStoreContent.StoreFolders, f => {
                        let childFolder = new FolderDataModel(f);
                        this.dataFolderDictionary[childFolder.path] = childFolder;

                        return childFolder;
                    });

                    folder.files = _.map(rawStoreContent.StoreFiles, f => new FileDataModel(f));

                    this.dataFolderDictionary[path] = folder;
                    return folder;
                });
            }

            return this.data.$q.resolve(this.dataFolderDictionary[path]);
        }

        private getApplicationTypes() {
            return Utils.getHttpResponseData(this.data.restClient.getApplicationTypes());
        }

        private getApplicationPackages() {
            return this.data.restClient.getApplications();
        }

        private getFolderDataModelByPath(path: string, currentFolder?: FolderDataModel): FolderDataModel {
            if (currentFolder === undefined) {
                currentFolder = this.dataFolderDictionary[""];
            }
            if (currentFolder.path.indexOf(path) !== -1) {
                return currentFolder;
            } else if (currentFolder.folders) {
                for (let i = 0; i < currentFolder.folders.length; i++) {
                    let tempFolder = this.getFolderDataModelByPath(path, currentFolder.folders[i]);
                    if ((tempFolder) !== null) {
                        return tempFolder;
                    }
                }
            }
            return null;
        }

        private recursivelySearch(searchTerm: string, currentFolder: FolderDataModel, folderResults: FolderDataModel[], fileResults: FileDataModel[]) {
            if (currentFolder.path.toLowerCase().indexOf(searchTerm) !== -1) {
                folderResults.push(currentFolder);
            }

            if (currentFolder.folders && currentFolder.folders.length > 0) {
                for (let i = 0; i < currentFolder.folders.length; i++) {
                    this.recursivelySearch(searchTerm, currentFolder.folders[i], folderResults, fileResults);
                }
            }

            if (currentFolder.files && currentFolder.files.length > 0) {
                for (let i = 0; i < currentFolder.files.length; i++) {
                    if (currentFolder.files[i].path.toLowerCase().indexOf(searchTerm) !== -1) {
                        fileResults.push(currentFolder.files[i]);
                    }
                }
            }
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
        public show: boolean = false;
        public indentationLevel: number = 0;
        public displayedSize: string;

        public get isReserved(): boolean {
            const root = this.path.split("\\")[0];
            return root === "Store" || root === "WindowsFabricStore";
        }
    }

    export class ImageStoreFolder extends ImageStoreItem {
        public fileCount: string;
        public isExpanded: boolean = false;
        public childrenFolders: ImageStoreFolder[];
        public childrenFiles: ImageStoreFile[];

        constructor(dataModel?: FolderDataModel, indentationLevel: number = 0) {
            super();

            if (!dataModel) {
                return;
            }

            this.path = dataModel.path;
            this.displayName = ImageStore.getDisplayName(dataModel.path);
            this.fileCount = dataModel.fileCount;
            this.displayedSize = Utils.getFriendlyFileSize(dataModel.size);
            this.indentationLevel = indentationLevel;
        }
    }

    export class ImageStoreFile extends ImageStoreItem {
        public version: string;
        public modifiedDate: string;

        constructor(dataModel?: FileDataModel, indentationLevel: number = 0) {
            super();

            if (!dataModel) {
                return;
            }

            this.path = dataModel.path;
            this.displayName = ImageStore.getDisplayName(dataModel.path);
            this.displayedSize = Utils.getFriendlyFileSize(dataModel.size);
            this.modifiedDate = dataModel.modifiedDate;
            this.version = dataModel.version;
            this.indentationLevel = indentationLevel;
        }
    }
}
