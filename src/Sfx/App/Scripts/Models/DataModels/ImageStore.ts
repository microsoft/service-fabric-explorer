module Sfx {
    export class ImageStore extends DataModelBase<IRawImageStoreContent> {

        public Folders: ImageStoreFolder[];
        public Files: ImageStoreFile[];
        public noOfApplicationTypes: number;
        public noOfApplications: number;
        public FolderDictionary: { [path: string]: ImageStoreFolder } = { };
        public FileDictionary: { [path: string]: ImageStoreFile } = { };
        private currentPath: string = null;


        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawImageStoreContent> {
            if (this.currentPath === null) {
                return Utils.getHttpResponseData(this.data.restClient.getImageStoreContent()).then<IRawImageStoreContent>(raw => {
                    this.Folders = _.map(raw.StoreFolders, f => {
                        let folder = new ImageStoreFolder();
                        folder.name = f.StoreRelativePath;
                        folder.indentationLevel = 0;
                        folder.fileCount = f.FileCount;
                        folder.version = "-";
                        folder.modifiedDate = "-";
                        folder.fileSize = "-";
                        folder.displayName = folder.name;
                        this.FolderDictionary[folder.name] = folder;
                        return folder;
                    });

                        this.Files = _.map(raw.StoreFiles, f => {
                        let file = new ImageStoreFile();
                        file.name = f.StoreRelativePath;
                        file.fileCount = "-";
                        file.modifiedDate = f.ModifiedDate;
                        file.version = f.FileVersion.VersionNumber;
                        file.fileSize = f.FileSize;
                        file.displayFileSize = this.getDisplayFileSize(Number(file.fileSize));
                        return file;
                    });
                    return raw;
                });
            }
        }

        protected retrieveData(path: string, messageHandler?: IResponseMessageHandler): angular.IPromise<IRawImageStoreContent> {
            return Utils.getHttpResponseData(this.data.restClient.getImageStoreContent(path)).then<IRawImageStoreContent>(raw => {
                this.FolderDictionary[path].childrenFolders = _.map(raw.StoreFolders, f => {
                    let folder = new ImageStoreFolder();
                    folder.name = f.StoreRelativePath;
                    folder.version = "-";
                    //console.log(folder.showChildren);
                    folder.modifiedDate = "-";
                    folder.fileSize = "-";
                    folder.fileCount = f.FileCount;
                    let childLength = folder.name.length;
                    let parentLength = path.length;
                    let childNameArray = folder.name.split("");
                    let displayNameArray = "";
                    let i = 0;
                    for (i = 1 ; i < childLength - parentLength; i++) {
                        displayNameArray += childNameArray[parentLength + i] ;
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
                    for (i = 1 ; i < childLength - parentLength; i++) {
                        displayNameArray += childNameArray[parentLength + i] ;
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

        protected getClickedInfo(path: string) {
            this.FolderDictionary[path].isExpanded = !this.FolderDictionary[path].isExpanded;
            if (this.FolderDictionary[path].isExpanded) {
                this.FolderDictionary[path].folderImage = "OpenFolderGray.svg";
            } else {
                this.FolderDictionary[path].folderImage = "ClosedFolder.svg";
            }
            this.FolderDictionary[path].Clicked = this.FolderDictionary[path].Clicked + 1;
        }

        protected getDisplayFileSize(fileSizeinBytes: number) {
            let displayFileSize: string;
            let byte = 1;
            let kiloByte = 1024 * byte ;
            let megaByte = 1024 * kiloByte;
            let gigaByte = 1024 * megaByte;
            let teraByte = 1024 * gigaByte;
            if (fileSizeinBytes <=  kiloByte) {
                displayFileSize = fileSizeinBytes + " Bytes";
            }else if (fileSizeinBytes < megaByte) {
                displayFileSize = (fileSizeinBytes / kiloByte).toFixed(2) + " KB";
            }else if (fileSizeinBytes < gigaByte) {
                displayFileSize = (fileSizeinBytes / megaByte).toFixed(2) + " MB";
            }else if (fileSizeinBytes < teraByte) {
                displayFileSize = (fileSizeinBytes / gigaByte).toFixed(2) + " GB";
            }else {
                displayFileSize = (fileSizeinBytes / teraByte).toFixed(2) + " TB";
            }
            return displayFileSize;
        }
        protected getNoOfApplicationTypes() {
            return Utils.getHttpResponseData(this.data.restClient.getApplicationTypes()).then<IRawApplicationType[]>(raw => {
                this.noOfApplicationTypes = raw.length;
                console.log(raw.length);
                //return raw.length;
                return raw;
            });
        }

        protected getNoOfApplicationPackages() {
            return this.data.restClient.getApplications().then<IRawApplication[]>(raw => {
                console.log(raw);
                return raw;
            });
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
        public show: boolean;
        public indentationLevel: number;
        public folderImage: string = "ClosedFolder.svg";
        public childrenFolders: ImageStoreFolder[];
        public childrenFiles: ImageStoreFile[];
    }

    export class ImageStoreFile {
        public name: string;
        public displayName: string;
        public version: string;
        public fileSize: string;
        public displayFileSize: string;
        public modifiedDate: string;
        public fileCount: string;
        public indentationLevel: number;
        public show: boolean;
    }
}
