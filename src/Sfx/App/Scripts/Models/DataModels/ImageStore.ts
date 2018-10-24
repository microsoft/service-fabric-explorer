module Sfx {
    export class ImageStore extends DataModelBase<IRawImageStoreContent> {

        public noOfApplicationPackages: number = 0;
        public noOfApplicationTypes: number = 0;
        public sizeOfAppPackages: string = "";
        public sizeOfAppTypes: string = "";
        public root: ImageStoreFolder = new ImageStoreFolder();
        public treeNodePaths: string[] = [];
        public parentRootFolder: ImageStoreFolder;
        public currentOpenFolders: string[] = [];
        public uiFolderDictionary: { [path: string]: ImageStoreFolder } = {};
        public dataFolderDictionary: { [path: string]: IRawImageStoreContent } = {};
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

            this.root.displayName = "root";
            this.root.isExpanded = true;
            this.root.indentationLevel = -1;

            // Push an empty string for root
            this.currentOpenFolders.push("");
            this.uiFolderDictionary[""] = this.root;

            this.refreshSummaryInfo();
        }

        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawImageStoreContent> {
            // Always get new data for root
            return Utils.getHttpResponseData(this.data.restClient.getImageStoreContent()).then<IRawImageStoreContent>(raw => {
                this.dataFolderDictionary[""] = raw;

                let tasks: angular.IPromise<IRawImageStoreContent>[] = [];
                for (let i = 0; i < this.currentOpenFolders.length; i++) {
                    const path = this.currentOpenFolders[i];
                    tasks.push(Utils.getHttpResponseData(this.data.restClient.getImageStoreContent(path)).then(rawStoreContent => this.dataFolderDictionary[path] = rawStoreContent));
                }

                return this.data.$q.all(tasks).then(() => raw);
            });
        }

        protected updateInternal(): angular.IPromise<any> | void {
            // Compare and update UI
            if (!this.root.childrenFolders || this.root.childrenFolders.length !== this.dataFolderDictionary[""].StoreFolders.length) {
                this.copyFolderContentToUI("");
            }
        }

        public refreshSummaryInfo(): angular.IPromise<any> {
            return this.getCompleteDataSet().then((r: ImageStoreFolder) => {
                return this.data.$q.all([
                    this.getApplicationPackages().then((packages) => {
                        this.noOfApplicationPackages = packages.length;
                        let spaceSize = 0;
                        for (let i = 0; i < packages.length; i++) {
                            spaceSize = spaceSize + this.getFolderSize(this.getFolderByPath(packages[i].Name.replace("fabric:/", "")));
                        }

                        this.sizeOfAppPackages = Utils.getFriendlyFileSize(spaceSize);
                    }),
                    this.getApplicationTypes().then((appTypes) => {
                        this.noOfApplicationTypes = appTypes.length;
                        let spaceSize = 0;
                        for (let j = 0; j < appTypes.length; j++) {
                            spaceSize = spaceSize + this.getFolderSize(this.getFolderByPath("Store\\" + appTypes[j].Name));
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

                this.currentOpenFolders.push(path);
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
                folder.childrenFolders.forEach(f => { this.closeFolder(f.name); f.show = false; });
            }

            this.currentOpenFolders.splice(this.currentOpenFolders.indexOf(path), 1);
        }

        protected getCompleteDataSet(): angular.IPromise<ImageStoreFolder> {
            return this.retrieveNewData().then((raw) => {
                let tasks: angular.IPromise<IRawImageStoreContent>[] = [];
                let rootFolder = new ImageStoreFolder();
                rootFolder.name = "";
                rootFolder.childrenFiles = _.map(raw.StoreFiles, (f) => { return new ImageStoreFile(f); });
                rootFolder.childrenFolders = _.map(raw.StoreFolders, f => { return new ImageStoreFolder(f); });
                for (let i = 0; i < rootFolder.childrenFolders.length; i++) {
                    tasks.push(this.getChildren(rootFolder.childrenFolders[i], rootFolder.childrenFolders[i].name));
                }

                return this.data.$q.all(tasks).then(t => {
                    this.parentRootFolder = rootFolder;
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
                    tasks.push(this.getChildren(currentFolder.childrenFolders[i], currentFolder.childrenFolders[i].name));
                }

                return this.data.$q.all(tasks).then(() => raw);
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
                let index = _.findIndex(folder.childrenFiles, f => f.name === path);
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
            return this.getFolderContentFromLocalDataSource(path).then(raw => {
                folder.childrenFolders = _.map(raw.StoreFolders, f => {
                    let childFolder = new ImageStoreFolder(f, folder.indentationLevel + 1);
                    this.uiFolderDictionary[childFolder.name] = childFolder;

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
                currentFolder = this.parentRootFolder;
            }
            if (currentFolder.name.indexOf(path) !== -1) {
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
                currentFolder = this.parentRootFolder;
            }

            if (currentFolder.name.toLowerCase().indexOf(searchTerm) !== -1) {
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
                currentFolder = this.parentRootFolder;
            }

            if (currentFolder.childrenFiles.length !== 0) {
                for (let i = 0; i < currentFolder.childrenFiles.length; i++) {
                    if (currentFolder.childrenFiles[i].name.toLowerCase().indexOf(searchTerm) !== -1) {
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

        private getFolderSize(folder: ImageStoreFolder): number {
            if (!folder) {
                return 0;
            }

            let folderSize: number = 0;
            if (folder.childrenFiles && folder.childrenFiles.length !== 0) {
                for (let i = 0; i < folder.childrenFiles.length; i++) {
                    folderSize = folderSize + Number(folder.childrenFiles[i].fileSize);
                }
            }

            if (folder.childrenFolders && folder.childrenFolders.length !== 0) {
                for (let i = 0; i < folder.childrenFolders.length; i++) {
                    folderSize = folderSize + this.getFolderSize(folder.childrenFolders[i]);
                }
            }

            return folderSize;
        }
    }

    export class ImageStoreItem {
        public name: string;
        public displayName: string;
        public indentationLevel: number = 0;
        public get isReserved(): boolean {
            const root = this.name.split("\\")[0];
            return root === "Store" || root === "WindowsFabricStore";
        }
    }

    export class ImageStoreFolder extends ImageStoreItem {
        public fileCount: string;
        public isExpanded: boolean = false;
        public show: boolean = false;
        public childrenFolders: ImageStoreFolder[];
        public childrenFiles: ImageStoreFile[];

        constructor(raw?: IRawStoreFolder, indentationLevel: number = 0) {
            super();

            if (!raw) {
                return;
            }

            this.name = raw.StoreRelativePath;
            this.displayName = ImageStore.getDisplayName(raw.StoreRelativePath);
            this.fileCount = raw.FileCount;
            this.indentationLevel = indentationLevel;
        }
    }

    export class ImageStoreFile extends ImageStoreItem {
        public displayFileSize: string;
        public show: boolean;
        public version: string;
        public fileSize: string;
        public modifiedDate: string;

        constructor(raw?: IRawStoreFile, indentationLevel: number = 0) {
            super();

            if (!raw) {
                return;
            }

            this.name = raw.StoreRelativePath;
            this.displayName = ImageStore.getDisplayName(raw.StoreRelativePath);
            this.fileSize = raw.FileSize;
            this.displayFileSize = Utils.getFriendlyFileSize(Number(raw.FileSize));
            this.modifiedDate = raw.ModifiedDate;
            this.version = raw.FileVersion.VersionNumber;
            this.indentationLevel = indentationLevel;
        }
    }
}
