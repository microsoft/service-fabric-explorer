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
        public UIFolderDictionary: { [path: string]: ImageStoreFolder } = {};

        public DataFolderDictionary: { [path: string]: IRawImageStoreContent } = {};

        constructor(public data: DataService) {
            super(data);

            this.root.displayName = "root";
            this.root.isExpanded = true;

            // Push an empty string for root
            this.currentOpenFolders.push("");
            this.UIFolderDictionary[""] = this.root;
        }

        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawImageStoreContent> {
            // Always get new data for root
            return Utils.getHttpResponseData(this.data.restClient.getImageStoreContent()).then<IRawImageStoreContent>(raw => {
                this.DataFolderDictionary[""] = raw;

                let tasks: angular.IPromise<IRawImageStoreContent>[] = [];
                for (let i = 0; i < this.currentOpenFolders.length; i++) {
                    const path = this.currentOpenFolders[i];
                    tasks.push(Utils.getHttpResponseData(this.data.restClient.getImageStoreContent(path)).then(rawStoreContent => this.DataFolderDictionary[path] = rawStoreContent));
                }

                return this.data.$q.all(tasks).then(() => raw);
            });
        }

        protected updateInternal(): angular.IPromise<any> | void {
            // Compare and update UI
            if (!this.root.childrenFolders || this.root.childrenFolders.length !== this.DataFolderDictionary[""].StoreFolders.length) {
                this.copyFolderContentToUI("");
            }
        }

        public getSummaryTabInfo() {
            this.getCompleteDataSet().then((r: ImageStoreFolder) => {
                this.getApplicationPackages().then((array) => {
                    this.noOfApplicationPackages = array.length;
                    let tempArray: string[] = [];
                    let tempSize = 0;
                    for (let i = 0; i < array.length; i++) {
                        tempArray[i] = array[i].Name.replace("fabric:/", "");
                        tempSize = tempSize + this.getFolderSize(this.getFolder(tempArray[i]));
                    }
                    this.sizeOfAppPackages = this.getDisplayFileSize(tempSize);
                });
                this.getApplicationTypes().then((array) => {
                    this.noOfApplicationTypes = array.length;
                    let tempSize = 0;
                    for (let j = 0; j < array.length; j++) {
                        tempSize = tempSize + this.getFolderSize(this.getFolder("Store\\" + array[j].Name));
                        this.sizeOfAppTypes = this.getDisplayFileSize(tempSize);
                    }
                });
            });
        }

        protected expandFolder(path: string) {
            const folder = this.UIFolderDictionary[path];
            if (!folder) {
                return;
            }

            this.copyFolderContentToUI(path).then(() => {
                folder.isExpanded = true;
                folder.folderImage = "OpenFolderGray.svg";

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
            const folder = this.UIFolderDictionary[path];
            if (!folder) {
                return;
            }

            folder.isExpanded = false;
            folder.folderImage = "ClosedFolder.svg";
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
                currentFolder.childrenFiles = _.map(raw.StoreFiles, f => { return new ImageStoreFile(f); });
                currentFolder.childrenFolders = _.map(raw.StoreFolders, f => { return new ImageStoreFolder(f); });

                let tasks: angular.IPromise<IRawImageStoreContent>[] = [];
                for (let i = 0; i < currentFolder.childrenFolders.length; i++) {
                    tasks.push(this.getChildren(currentFolder.childrenFolders[i], currentFolder.childrenFolders[i].name));
                }

                return this.data.$q.all(tasks).then(() => raw);
            });
        }

        protected deleteFolder(path: string) {
            this.UIFolderDictionary[path].show = false;
            delete this.UIFolderDictionary[path];
            delete this.DataFolderDictionary[path];
            return Utils.getHttpResponseData(this.data.restClient.deleteImageStoreContent(path)).then(() => {
            });
        }

        private copyFolderContentToUI(path: string): angular.IPromise<void> {
            const parent = this.UIFolderDictionary[path];
            return this.getFolderContentFromLocalDataSource(path).then(raw => {
                parent.childrenFolders = _.map(raw.StoreFolders, f => {
                    let folder = new ImageStoreFolder();
                    folder.name = f.StoreRelativePath;
                    folder.displayName = this.getDisplayName(f.StoreRelativePath);
                    folder.indentationLevel = parent.indentationLevel + 1;
                    folder.fileCount = f.FileCount;
                    folder.version = "-";
                    folder.modifiedDate = "-";
                    folder.fileSize = "-";

                    this.UIFolderDictionary[folder.name] = folder;

                    return folder;
                });

                parent.childrenFiles = _.map(raw.StoreFiles, f => {
                    let file = new ImageStoreFile();
                    file.name = f.StoreRelativePath;
                    file.displayName = this.getDisplayName(f.StoreRelativePath);
                    file.fileCount = "-";
                    file.modifiedDate = f.ModifiedDate;
                    file.version = f.FileVersion.VersionNumber;
                    file.fileSize = f.FileSize;
                    file.displayFileSize = this.getDisplayFileSize(Number(file.fileSize));

                    return file;
                });
            });
        }

        private getFolderContentFromLocalDataSource(path: string): angular.IPromise<IRawImageStoreContent> {
            if (!this.DataFolderDictionary[path]) {
                return Utils.getHttpResponseData(this.data.restClient.getImageStoreContent(path)).then(rawStoreContent => { this.DataFolderDictionary[path] = rawStoreContent; return rawStoreContent; });
            }

            return this.data.$q.resolve(this.DataFolderDictionary[path]);
        }

        private getDisplayName(fullPath: string) {
            const segments = fullPath.split("\\");
            if (segments.length === 1) {
                return fullPath;
            }

            return segments[segments.length - 1];
        }

        private getDisplayFileSize(fileSizeinBytes: number) {
            let displayFileSize: string;
            let byte = 1;
            let kiloByte = 1024 * byte;
            let megaByte = 1024 * kiloByte;
            let gigaByte = 1024 * megaByte;
            let teraByte = 1024 * gigaByte;
            if (fileSizeinBytes <= kiloByte) {
                displayFileSize = fileSizeinBytes + " Bytes";
            } else if (fileSizeinBytes < megaByte) {
                displayFileSize = (fileSizeinBytes / kiloByte).toFixed(2) + " KB";
            } else if (fileSizeinBytes < gigaByte) {
                displayFileSize = (fileSizeinBytes / megaByte).toFixed(2) + " MB";
            } else if (fileSizeinBytes < teraByte) {
                displayFileSize = (fileSizeinBytes / gigaByte).toFixed(2) + " GB";
            } else {
                displayFileSize = (fileSizeinBytes / teraByte).toFixed(2) + " TB";
            }
            return displayFileSize;
        }

        private getApplicationTypes() {
            return Utils.getHttpResponseData(this.data.restClient.getApplicationTypes()).then<IRawApplicationType[]>(raw => {
                this.noOfApplicationTypes = raw.length;
                return raw;
            });
        }

        private getApplicationPackages() {
            return this.data.restClient.getApplications().then<IRawApplication[]>(raw => {
                return raw;
            });
        }

        private getPaths(folders: ImageStoreFolder[], files: ImageStoreFile[]) {
            for (let i = 0; i < folders.length; i++) {
                if (folders[i].show === true && this.treeNodePaths.indexOf(folders[i].name) === -1) {
                    this.treeNodePaths.push(folders[i].name);
                }
                if (folders[i].isExpanded === true) {
                    this.getPaths(folders[i].childrenFolders, folders[i].childrenFiles);
                }
            }
            for (let j = 0; j < files.length; j++) {
                if (files[j].show === true && this.treeNodePaths.indexOf(files[j].name) === -1) {
                    this.treeNodePaths.push(files[j].name);
                }
            }
            return this.treeNodePaths;
        }

        private getFolder(path: string, currentFolder?: ImageStoreFolder) {
            if (currentFolder === undefined) {
                currentFolder = this.parentRootFolder;
            }
            if (currentFolder.name.indexOf(path) !== -1) {
                return currentFolder;
            } else if (currentFolder.childrenFolders) {
                for (let i = 0; i < currentFolder.childrenFolders.length; i++) {
                    let tempFolder = this.getFolder(path, currentFolder.childrenFolders[i]);
                    if ((tempFolder) !== null) {
                        return tempFolder;
                    }
                }
            }
            return null;
        }

        private getFolders(searchTerm: string, currentFolder?: ImageStoreFolder) {
            let listOfRelevantFolders: ImageStoreFolder[] = [];
            if (currentFolder === undefined) {
                currentFolder = this.parentRootFolder;
            }
            if (currentFolder.name.indexOf(searchTerm) !== -1) {
                listOfRelevantFolders.push(currentFolder);
            }
            if (currentFolder.childrenFolders.length !== 0) {
                for (let i = 0; i < currentFolder.childrenFolders.length; i++) {
                    let temp = this.getFolders(searchTerm, currentFolder.childrenFolders[i]);
                    if ((temp.length) !== 0) {
                        listOfRelevantFolders = listOfRelevantFolders.concat(temp);
                    }
                }
            }
            return listOfRelevantFolders;
        }

        private getFiles(searchTerm: string, currentFolder?: ImageStoreFolder) {
            let listOfRelevantFiles: ImageStoreFile[] = [];
            if (currentFolder === undefined) {
                currentFolder = this.parentRootFolder;
            }
            if (currentFolder.childrenFiles.length !== 0) {
                for (let i = 0; i < currentFolder.childrenFiles.length; i++) {
                    if (currentFolder.childrenFiles[i].name.indexOf(searchTerm) !== -1) {
                        listOfRelevantFiles.push(currentFolder.childrenFiles[i]);
                    }
                }
            }
            if (currentFolder.childrenFolders.length !== 0) {
                for (let i = 0; i < currentFolder.childrenFolders.length; i++) {
                    let temp = this.getFiles(searchTerm, currentFolder.childrenFolders[i]);
                    if ((temp.length) !== 0) {
                        listOfRelevantFiles = listOfRelevantFiles.concat(temp);
                    }
                }
            }
            return listOfRelevantFiles;
        }

        private getFolderSize(folder: ImageStoreFolder): number {
            let folderSize: number = 0;
            if (folder.childrenFiles.length !== 0) {
                for (let i = 0; i < folder.childrenFiles.length; i++) {
                    folderSize = folderSize + Number(folder.childrenFiles[i].fileSize);
                }
            }

            if (folder.childrenFolders.length !== 0) {
                for (let i = 0; i < folder.childrenFolders.length; i++) {
                    folderSize = folderSize + this.getFolderSize(folder.childrenFolders[i]);
                }
            }

            return folderSize;
        }
    }



    export class ImageStoreFolder {
        public name: string;
        public displayName: string;
        public version: string;
        public fileCount: string;
        public modifiedDate: string;
        public fileSize: string;
        public isExpanded: boolean = false;
        public show: boolean = false;
        public indentationLevel: number = 0;
        public folderImage: string = "Closedfolder.svg";
        public childrenFolders: ImageStoreFolder[];
        public childrenFiles: ImageStoreFile[];

        constructor(raw?: IRawStoreFolder) {
            if (!raw) {
                return;
            }
            this.folderImage = "Closedfolder.svg";
            this.name = raw.StoreRelativePath;
            this.fileCount = raw.FileCount;
        }
    }

    export class ImageStoreFile {

        public displayName: string;
        public displayFileSize: string;
        public fileCount: string;
        public indentationLevel: number = 0;
        public show: boolean;
        public name: string;
        public version: string;
        public fileSize: string;
        public modifiedDate: string;

        constructor(raw?: IRawStoreFile) {
            if (!raw) {
                return;
            }
            this.name = raw.StoreRelativePath;
            this.fileSize = raw.FileSize;
            this.modifiedDate = raw.ModifiedDate;
            this.version = raw.FileVersion.VersionNumber;
        }
    }
}
