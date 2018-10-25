module Sfx {
    export class ImageStore extends DataModelBase<IRawImageStoreContent> {

        public noOfApplicationPackages: number = 0;
        public noOfApplicationTypes: number = 0;
        public sizeOfAppPackages: string = "";
        public sizeOfAppTypes: string = "";
        public root: ImageStoreFolder = new ImageStoreFolder();
        public uiFolderDictionary: { [path: string]: ImageStoreFolder } = {};
        public dataFolderDictionary: { [path: string]: IRawImageStoreContent } = {};

        public openedFolderPathes: string[] = [];
        public relevantFolders: ImageStoreFolder[] = [];
        public relevantFiles: ImageStoreFile[] = [];

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

            this.refreshSummaryInfo();
            this.expandFolder(this.root.path);
        }

        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawImageStoreContent> {
            // Always get new data for root
            return Utils.getHttpResponseData(this.data.restClient.getImageStoreContent()).then<IRawImageStoreContent>(raw => {
                this.dataFolderDictionary[""] = raw;

                let tasks: angular.IPromise<IRawImageStoreContent>[] = [];
                for (let i = 0; i < this.openedFolderPathes.length; i++) {
                    const path = this.openedFolderPathes[i];
                    tasks.push(Utils.getHttpResponseData(this.data.restClient.getImageStoreContent(path)).then(rawStoreContent => this.dataFolderDictionary[path] = rawStoreContent));
                }

                return this.data.$q.all(tasks).then(() => raw);
            });
        }

        protected updateInternal(): angular.IPromise<any> | void {
            // Compare and update UI
            // const root = this.uiFolderDictionary[""];
            // if (!root.childrenFolders || root.childrenFolders.length !== this.dataFolderDictionary[""].StoreFolders.length) {
            //     this.copyFolderContentToUI("");
            // }
        }

        public refreshSummaryInfo(): angular.IPromise<any> {
            return this.getCompleteDataSet().then((r: ImageStoreFolder) => {
                return this.data.$q.all([
                    this.getApplicationPackages().then((packages) => {
                        this.noOfApplicationPackages = packages.length;
                        let spaceSize = 0;
                        for (let i = 0; i < packages.length; i++) {
                            let folder = this.getFolderByPath(packages[i].Name.replace("fabric:/", ""));
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
                            let folder = this.getFolderByPath("Store\\" + appTypes[j].Name);
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

        protected getCompleteDataSet(): angular.IPromise<ImageStoreFolder> {
            return this.retrieveNewData().then(raw => {
                let tasks: angular.IPromise<IRawImageStoreContent>[] = [];

                let rootFolder = this.uiFolderDictionary[""];
                if (!rootFolder.childrenFiles || !rootFolder.childrenFolders) {
                    rootFolder.childrenFiles = _.map(raw.StoreFiles, f => { return new ImageStoreFile(f); });
                    rootFolder.childrenFolders = _.map(raw.StoreFolders, f => { return new ImageStoreFolder(f); });
                }

                for (let i = 0; i < rootFolder.childrenFolders.length; i++) {
                    tasks.push(this.getChildren(rootFolder.childrenFolders[i], rootFolder.childrenFolders[i].path));
                }

                return this.data.$q.all(tasks).then(t => {

                    let size: number = 0;
                    _.each(rootFolder.childrenFiles, file => size = size + file.size);
                    _.each(rootFolder.childrenFolders, folder => size = size + folder.size);

                    rootFolder.size = size;

                    _.each(this.openedFolderPathes, folderPath => {
                        const folder = this.uiFolderDictionary[folderPath];
                        folder.displayedSize = Utils.getFriendlyFileSize(folder.size);
                        _.each(folder.childrenFolders, childFolder => childFolder.displayedSize = Utils.getFriendlyFileSize(childFolder.size));
                    });


                    return rootFolder;
                });
            });
        }

        protected getChildren(currentFolder: ImageStoreFolder, path: string, messageHandler?: IResponseMessageHandler): angular.IPromise<IRawImageStoreContent> {
            return Utils.getHttpResponseData(this.data.restClient.getImageStoreContent(path)).then<IRawImageStoreContent>(raw => {
                currentFolder.childrenFiles = _.map(raw.StoreFiles, f => { return new ImageStoreFile(f, currentFolder.indentationLevel + 1); });
                currentFolder.childrenFolders = _.map(raw.StoreFolders, f => { return new ImageStoreFolder(f, currentFolder.indentationLevel + 1); });

                let tasks: angular.IPromise<IRawImageStoreContent>[] = [];
                for (let i = 0; i < currentFolder.childrenFolders.length; i++) {
                    tasks.push(this.getChildren(currentFolder.childrenFolders[i], currentFolder.childrenFolders[i].path));
                }

                return this.data.$q.all(tasks).then(() => {
                    let size: number = 0;
                    _.each(currentFolder.childrenFiles, file => size = size + file.size);
                    _.each(currentFolder.childrenFolders, folder => size = size + folder.size);

                    currentFolder.size = size;
                    if (_.find(this.openedFolderPathes, currentFolder.path)) {
                        currentFolder.isExpanded = true;
                    }

                    this.uiFolderDictionary[currentFolder.path] = currentFolder;
                    console.log(currentFolder.path, size);
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
                index = _.findIndex(dataFolder.StoreFiles, f => f.StoreRelativePath === path);
                if (index >= 0) {
                    dataFolder.StoreFiles.splice(index, 1);
                }

            }

            return Utils.getHttpResponseData(this.data.restClient.deleteImageStoreContent(path));
        }

        protected search(searchTerm: string): angular.IPromise<void> {
            if (!searchTerm) {
                return this.data.$q.resolve();
            }

            return this.getCompleteDataSet().then(() => {
                this.relevantFolders = this.searchFolders(searchTerm);
                this.relevantFiles = this.searchFiles(searchTerm);
            });
        }

        private copyFolderContentToUI(path: string): angular.IPromise<void> {
            const folder = this.uiFolderDictionary[path];

            if (folder) {
                return this.data.$q.resolve();
            }

            return this.getFolderContentFromLocalDataSource(path).then(raw => {
                folder.childrenFolders = _.map(raw.StoreFolders, f => {
                    let childFolder = new ImageStoreFolder(f, folder.indentationLevel + 1);
                    this.uiFolderDictionary[childFolder.path] = childFolder;

                    return childFolder;
                });

                folder.childrenFiles = _.map(raw.StoreFiles, f => new ImageStoreFile(f, folder.indentationLevel + 1));
            });
        }

        private getFolderContentFromLocalDataSource(path: string): angular.IPromise<IRawImageStoreContent> {
            if (!this.dataFolderDictionary[path]) {
                return Utils.getHttpResponseData(this.data.restClient.getImageStoreContent(path)).then(rawStoreContent => { this.dataFolderDictionary[path] = rawStoreContent; return rawStoreContent; });
            }

            return this.data.$q.resolve(this.dataFolderDictionary[path]);
        }

        private getApplicationTypes() {
            return Utils.getHttpResponseData(this.data.restClient.getApplicationTypes());
        }

        private getApplicationPackages() {
            return this.data.restClient.getApplications();
        }

        private getFolderByPath(path: string, currentFolder?: ImageStoreFolder) {
            if (currentFolder === undefined) {
                currentFolder = this.uiFolderDictionary[""];
            }
            if (currentFolder.path.indexOf(path) !== -1) {
                return currentFolder;
            } else if (currentFolder.childrenFolders) {
                for (let i = 0; i < currentFolder.childrenFolders.length; i++) {
                    let tempFolder = this.getFolderByPath(path, currentFolder.childrenFolders[i]);
                    if ((tempFolder) !== null) {
                        return tempFolder;
                    }
                }
            }
            return null;
        }

        private searchFolders(searchTerm: string, currentFolder?: ImageStoreFolder) {
            searchTerm = searchTerm.toLowerCase();
            let listOfRelevantFolders: ImageStoreFolder[] = [];
            if (currentFolder === undefined) {
                currentFolder = this.uiFolderDictionary[""];
            }

            if (currentFolder.path.toLowerCase().indexOf(searchTerm) !== -1) {
                listOfRelevantFolders.push(currentFolder);
            }

            if (currentFolder.childrenFolders.length !== 0) {
                for (let i = 0; i < currentFolder.childrenFolders.length; i++) {
                    let temp = this.searchFolders(searchTerm, currentFolder.childrenFolders[i]);
                    if ((temp.length) !== 0) {
                        listOfRelevantFolders = listOfRelevantFolders.concat(temp);
                    }
                }
            }

            return listOfRelevantFolders;
        }

        private searchFiles(searchTerm: string, currentFolder?: ImageStoreFolder) {
            searchTerm = searchTerm.toLowerCase();
            let listOfRelevantFiles: ImageStoreFile[] = [];
            if (currentFolder === undefined) {
                currentFolder = this.uiFolderDictionary[""];
            }

            if (currentFolder.childrenFiles.length !== 0) {
                for (let i = 0; i < currentFolder.childrenFiles.length; i++) {
                    if (currentFolder.childrenFiles[i].path.toLowerCase().indexOf(searchTerm) !== -1) {
                        listOfRelevantFiles.push(currentFolder.childrenFiles[i]);
                    }
                }
            }

            if (currentFolder.childrenFolders.length !== 0) {
                for (let i = 0; i < currentFolder.childrenFolders.length; i++) {
                    let temp = this.searchFiles(searchTerm, currentFolder.childrenFolders[i]);
                    if ((temp.length) !== 0) {
                        listOfRelevantFiles = listOfRelevantFiles.concat(temp);
                    }
                }
            }

            return listOfRelevantFiles;
        }
    }

    export class ImageStoreItem {
        public path: string;
        public displayName: string;
        public show: boolean = false;
        public indentationLevel: number = 0;
        public displayedSize: string;
        private _size: number = 0;

        public set size(size) {
            this._size = size;
            this.displayedSize = Utils.getFriendlyFileSize(size);
        }

        public get size(): number {
            return this._size;
        }

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

        constructor(raw?: IRawStoreFolder, indentationLevel: number = 0) {
            super();

            if (!raw) {
                return;
            }

            this.path = raw.StoreRelativePath;
            this.displayName = ImageStore.getDisplayName(raw.StoreRelativePath);
            this.fileCount = raw.FileCount;
            this.indentationLevel = indentationLevel;
        }
    }

    export class ImageStoreFile extends ImageStoreItem {
        public version: string;
        public modifiedDate: string;

        constructor(raw?: IRawStoreFile, indentationLevel: number = 0) {
            super();

            if (!raw) {
                return;
            }

            this.path = raw.StoreRelativePath;
            this.displayName = ImageStore.getDisplayName(raw.StoreRelativePath);
            this.size = Number(raw.FileSize);
            this.modifiedDate = raw.ModifiedDate;
            this.version = raw.FileVersion.VersionNumber;
            this.indentationLevel = indentationLevel;
        }
    }
}
