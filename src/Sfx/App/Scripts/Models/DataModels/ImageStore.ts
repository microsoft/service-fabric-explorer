module Sfx {
    export class ImageStore extends DataModelBase<IRawImageStoreContent> {

        public rootFolder: ImageStoreFolder = new ImageStoreFolder();
        public Folders: ImageStoreFolder[];
        public Files: ImageStoreFile[];
        public refreshFolders: ImageStoreFolder[];
        public refreshFiles: ImageStoreFile[];
        public parentRootFolder: ImageStoreFolder;
        public parentFolder: ImageStoreFolder;
        public currentTreeStructure: string[] = [];
        public openFolders: string[] = [];
        public noOfApplicationTypes: number;
        public noOfApplications: number;
        public FolderDictionary: { [path: string]: ImageStoreFolder } = {};
        public FolderDictionaryR: { [path: string]: ImageStoreFolder } = {};
        public FileDictionary: { [path: string]: ImageStoreFile } = {};


        // protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawImageStoreContent> {
        //     return Utils.getHttpResponseData(this.data.restClient.getImageStoreContent()).then<IRawImageStoreContent>(raw => {
        //         this.Folders = _.map(raw.StoreFolders, f => {
        //             let folder = new ImageStoreFolder();
        //             folder.name = f.StoreRelativePath;
        //             folder.indentationLevel = 0;
        //             folder.fileCount = f.FileCount;
        //             folder.version = "-";
        //             folder.modifiedDate = "-";
        //             folder.fileSize = "-";
        //             folder.displayName = folder.name;
        //             folder.show = true;
        //             this.FolderDictionary[folder.name] = folder;
        //             return folder;
        //         });

        //         this.Files = _.map(raw.StoreFiles, f => {
        //             let file = new ImageStoreFile();
        //             file.name = f.StoreRelativePath;
        //             file.fileCount = "-";
        //             file.show = true;
        //             file.modifiedDate = f.ModifiedDate;
        //             file.version = f.FileVersion.VersionNumber;
        //             file.fileSize = f.FileSize;
        //             file.displayFileSize = this.getDisplayFileSize(Number(file.fileSize));
        //             return file;
        //         });
        //         return raw;
        //     });
        // }

        constructor (public data: DataService) {
            super(data);

            this.rootFolder.displayName = "ImageStoreRoot";
            this.rootFolder.indentationLevel = 0;
        }

        protected retrieveNewDataForRoot(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawImageStoreContent> {

            return Utils.getHttpResponseData(this.data.restClient.getImageStoreContent()).then<IRawImageStoreContent>(raw => {
                this.rootFolder.childrenFolders = _.map(raw.StoreFolders, f => {
                    let folder = new ImageStoreFolder();
                    folder.name = f.StoreRelativePath;
                    folder.indentationLevel = 0;
                    folder.fileCount = f.FileCount;
                    folder.version = "-";
                    folder.modifiedDate = "-";
                    folder.fileSize = "-";
                    folder.displayName = folder.name;
                    folder.show = true;
                    this.FolderDictionary[folder.name] = folder;
                    return folder;
                });

                this.rootFolder.childrenFiles = _.map(raw.StoreFiles, f => {
                    let file = new ImageStoreFile();
                    file.name = f.StoreRelativePath;
                    file.fileCount = "-";
                    file.show = true;
                    file.modifiedDate = f.ModifiedDate;
                    file.version = f.FileVersion.VersionNumber;
                    file.fileSize = f.FileSize;
                    file.displayFileSize = this.getDisplayFileSize(Number(file.fileSize));
                    return file;
                });

                return raw;
            });
        }

        protected retrieveData(path: string, messageHandler?: IResponseMessageHandler): angular.IPromise<IRawImageStoreContent> {
            return Utils.getHttpResponseData(this.data.restClient.getImageStoreContent(path)).then<IRawImageStoreContent>(raw => {
                this.FolderDictionary[path].childrenFolders = _.map(raw.StoreFolders, f => {
                    let folder = new ImageStoreFolder();
                    folder.name = f.StoreRelativePath;
                    folder.version = "-";
                    folder.modifiedDate = "-";
                    folder.fileSize = "-";
                    folder.fileCount = f.FileCount;
                    let childLength = folder.name.length;
                    let parentLength = path.length;
                    let childNameArray = folder.name.split("");
                    let displayNameArray = "";
                    let i = 0;
                    for (i = 1; i < childLength - parentLength; i++) {
                        displayNameArray += childNameArray[parentLength + i];
                    }
                    folder.displayName = displayNameArray;
                    this.FolderDictionary[folder.name] = folder;
                    //To find out level of indentation
                    let j = 0;
                    folder.indentationLevel = 0;
                    for (j = 0; j < childLength; j++) {
                        if (childNameArray[j] === "\\") {
                            folder.indentationLevel += 1;
                        }
                    }
                    if ((this.FolderDictionary[path].Clicked % 2) === 0) {
                        folder.show = false;
                    } else if ((this.FolderDictionary[path].Clicked % 2) !== 0) {
                        folder.show = true;
                    }
                    return folder;
                });

                this.FolderDictionary[path].childrenFiles = _.map(raw.StoreFiles, f => {
                    let file = new ImageStoreFile();
                    file.name = f.StoreRelativePath;
                    file.version = f.FileVersion.VersionNumber;
                    file.fileSize = f.FileSize;
                    file.displayFileSize = this.getDisplayFileSize(Number(file.fileSize));
                    file.modifiedDate = f.ModifiedDate;
                    file.fileCount = "-";
                    let childLength = file.name.length;
                    let parentLength = path.length;
                    let childNameArray = file.name.split("");
                    let displayNameArray = "";
                    let i = 0;
                    for (i = 1; i < childLength - parentLength; i++) {
                        displayNameArray += childNameArray[parentLength + i];
                    }
                    file.displayName = displayNameArray;
                    let j = 0;
                    file.indentationLevel = 0;
                    for (j = 0; j < childLength; j++) {
                        if (childNameArray[j] === "\\") {
                            file.indentationLevel += 1;
                        }
                    }
                    if ((this.FolderDictionary[path].Clicked % 2) === 0) {
                        file.show = false;
                    } else if ((this.FolderDictionary[path].Clicked % 2) !== 0) {
                        file.show = true;
                    }
                    return file;
                });

                return raw;
            });
        }

        protected retrieveDataR(path: string, messageHandler?: IResponseMessageHandler): angular.IPromise<IRawImageStoreContent> {
            return Utils.getHttpResponseData(this.data.restClient.getImageStoreContent(path)).then<IRawImageStoreContent>(raw => {
                this.FolderDictionaryR[path].childrenFolders = _.map(raw.StoreFolders, f => {
                    let folder = new ImageStoreFolder();
                    folder.name = f.StoreRelativePath;
                    folder.version = "-";
                    folder.modifiedDate = "-";
                    folder.fileSize = "-";
                    folder.fileCount = f.FileCount;
                    let childLength = folder.name.length;
                    let parentLength = path.length;
                    let childNameArray = folder.name.split("");
                    let displayNameArray = "";
                    let i = 0;
                    for (i = 1; i < childLength - parentLength; i++) {
                        displayNameArray += childNameArray[parentLength + i];
                    }
                    folder.displayName = displayNameArray;
                    this.FolderDictionaryR[folder.name] = folder;
                    //To find out level of indentation
                    let j = 0;
                    folder.indentationLevel = 0;
                    for (j = 0; j < childLength; j++) {
                        if (childNameArray[j] === "\\") {
                            folder.indentationLevel += 1;
                        }
                    }
                    if ((this.FolderDictionaryR[path].Clicked % 2) === 0) {
                        folder.show = false;
                    } else if ((this.FolderDictionaryR[path].Clicked % 2) !== 0) {
                        folder.show = true;
                    }
                    return folder;
                });

                this.FolderDictionaryR[path].childrenFiles = _.map(raw.StoreFiles, f => {
                    let file = new ImageStoreFile();
                    file.name = f.StoreRelativePath;
                    file.version = f.FileVersion.VersionNumber;
                    file.fileSize = f.FileSize;
                    file.displayFileSize = this.getDisplayFileSize(Number(file.fileSize));
                    file.modifiedDate = f.ModifiedDate;
                    file.fileCount = "-";
                    let childLength = file.name.length;
                    let parentLength = path.length;
                    let childNameArray = file.name.split("");
                    let displayNameArray = "";
                    let i = 0;
                    for (i = 1; i < childLength - parentLength; i++) {
                        displayNameArray += childNameArray[parentLength + i];
                    }
                    file.displayName = displayNameArray;
                    let j = 0;
                    file.indentationLevel = 0;
                    for (j = 0; j < childLength; j++) {
                        if (childNameArray[j] === "\\") {
                            file.indentationLevel += 1;
                        }
                    }
                    if ((this.FolderDictionaryR[path].Clicked % 2) === 0) {
                        file.show = false;
                    } else if ((this.FolderDictionaryR[path].Clicked % 2) !== 0) {
                        file.show = true;
                    }
                    return file;
                });

                return raw;
            });
        }

        protected retrieveDataV2(currentFolder: ImageStoreFolder, path: string, messageHandler?: IResponseMessageHandler): angular.IPromise<IRawImageStoreContent> {
            return Utils.getHttpResponseData(this.data.restClient.getImageStoreContent(path)).then<IRawImageStoreContent>(raw => {
                currentFolder.childrenFiles = _.map(raw.StoreFiles, f => { return new ImageStoreFile(f); });
                currentFolder.childrenFolders = _.map(raw.StoreFolders, f => { return new ImageStoreFolder(f); });

                let tasks: angular.IPromise<IRawImageStoreContent>[] = [];
                for (let i = 0; i < currentFolder.childrenFolders.length; i++) {
                    tasks.push(this.retrieveDataV2(currentFolder.childrenFolders[i], currentFolder.childrenFolders[i].name));
                }

                return this.data.$q.all(tasks).then(() => raw);
            });
        }

        protected getClickedInfo(path: string) {
            this.FolderDictionary[path].isExpanded = !this.FolderDictionary[path].isExpanded;
            if (this.FolderDictionary[path].isExpanded) {
                this.FolderDictionary[path].folderImage = "OpenFolderGray.svg";
                this.openFoldersPush(path);
            } else {
                this.FolderDictionary[path].folderImage = "ClosedFolder.svg";
                this.openFoldersPop(path);
            }
            this.FolderDictionary[path].Clicked = this.FolderDictionary[path].Clicked + 1;
        }

        protected getDisplayFileSize(fileSizeinBytes: number) {
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
        protected getNoOfApplicationTypes() {
            return Utils.getHttpResponseData(this.data.restClient.getApplicationTypes()).then<IRawApplicationType[]>(raw => {
                this.noOfApplicationTypes = raw.length;
                return raw;
            });
        }

        protected getNoOfApplicationPackages() {
            return this.data.restClient.getApplications().then<IRawApplication[]>(raw => {
                return raw;
            });
        }
        protected getCompleteDataSet(): angular.IPromise<ImageStoreFolder> {
            return this.retrieveNewData().then((raw) => {
                let tasks: angular.IPromise<IRawImageStoreContent>[] = [];
                let rootFolder = new ImageStoreFolder();
                rootFolder.name = "";
                rootFolder.childrenFiles = _.map(raw.StoreFiles, (f) => { return new ImageStoreFile(f); });
                rootFolder.childrenFolders = _.map(raw.StoreFolders, f => { return new ImageStoreFolder(f); });
                for (let i = 0; i < rootFolder.childrenFolders.length; i++) {
                    tasks.push(this.retrieveDataV2(rootFolder.childrenFolders[i], rootFolder.childrenFolders[i].name));
                }

                return this.data.$q.all(tasks).then(t => {
                    this.parentRootFolder = rootFolder;
                    return rootFolder;
                });
            });
        }

        public getPaths(folders: ImageStoreFolder[], files: ImageStoreFile[]) {
            let treeNodePaths: string[];

            for (let i = 0; i < folders.length; i++) {
                if (folders[i].show === true && treeNodePaths.indexOf(folders[i].name) === -1) {
                    treeNodePaths.push(folders[i].name);
                }
                if (folders[i].isExpanded === true) {
                    treeNodePaths.concat(this.getPaths(folders[i].childrenFolders, folders[i].childrenFiles));
                }
            }
            for (let j = 0; j < files.length; j++) {
                if (files[j].show === true && treeNodePaths.indexOf(files[j].name) === -1) {
                    treeNodePaths.push(files[j].name);
                }
            }

            return treeNodePaths;
        }

        protected getFolder(path: string, currentFolder?: ImageStoreFolder) {
            if (currentFolder === undefined) {
                currentFolder = this.parentRootFolder;
            }
            if (path === currentFolder.name) {
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

        public retrieveDataForGivenFolders(openFolders: string[]) {

            // Load data for all the open folders, save it to a local var

            let refreshedData = this.retrieveNewDataForRoot().then((raw) => {
                const tasks: Array<angular.IPromise<any>> = [];

                for (let i = 0; i < openFolders.length; i++) {
                    tasks.push(this.retrieveDataR(this.refreshFolders[i].name).then(() => {
                        for (let j = 0; j < openFolders.length; j++) {
                            if (this.refreshFolders[i].name === this.openFolders[j]) {
                                this.refreshFolders[i].Clicked++;
                                this.refreshFolders[i].isExpanded = true;
                                return this.refreshTreeForChildren(openFolders, this.refreshFolders[i].childrenFolders, this.refreshFolders[i].childrenFiles);
                            }
                        }
                    }));
                }

                this.data.$q.all(tasks).then(() => {
                    // Here we have all data from service for the open folders
                    // The local var should be just a string[] which has path to folders/files
                    // return that local var here
                });
            });
        }
        public getOpenFolders() {
            return this.openFolders;
        }

        private refreshTreeForChildren(openFolders: string[], folders: ImageStoreFolder[], files: ImageStoreFile[]) {
            // let tasks: angular.IPromise<IRawImageStoreContent>[] = [];
            for (let j = 0; j < files.length; j++) {
                files[j].show = true;
            }
            const tasks: Array<angular.IPromise<any>> = [];

            for (let i = 0; i < folders.length; i++) {
                tasks.push(this.retrieveData(folders[i].name).then((raw) => {
                    folders[i].show = true;
                    for (let j = 0; j < this.openFolders.length; j++) {
                        if (folders[i].name === this.openFolders[j]) {
                            folders[i].isExpanded = true;
                            folders[i].Clicked++;
                            return this.refreshTreeForChildren(openFolders, folders[i].childrenFolders, folders[i].childrenFiles);
                        }
                    }
                }));
            }
            return this.data.$q.all(tasks);
        }

        private openFoldersPush(path: string) {
            this.openFolders.push(path);
        }

        private openFoldersPop(path: string) {
            if (this.openFolders.length !== 0) {
                for (let i = 0; i < this.openFolders.length; i++) {
                    if (path === this.openFolders[i]) {
                        this.openFolders.splice(i, 1);
                    }
                }
            }
        }
    }



    export class ImageStoreFolder {
        public name: string;
        public displayName: string;
        public version: string;
        public fileCount: string;
        public modifiedDate: string;
        public fileSize: string;
        public Clicked: number = 0;
        public isExpanded: boolean = false;
        public show: boolean = false;
        public indentationLevel: number;
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
        public indentationLevel: number;
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
        populateFileData(raw: IRawStoreFile) {
            this.name = raw.StoreRelativePath;
            this.fileSize = raw.FileSize;
            this.modifiedDate = raw.ModifiedDate;
            this.version = raw.FileVersion.VersionNumber;
        }
    }
}
