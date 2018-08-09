
module Sfx {
    export class ImageStoreViewController {
        public static $inject = ["$scope", "$timeout"];
        public constructor(private $scope: any, private $timeout: any) {
        }

        public click(itemName: string) {
            this.$scope.showDeleteConfirmation = true;
            this.$scope.itemName = itemName;
            this.$scope.confirmationKeyword = itemName;
        }

        public cancel() {
            this.$scope.showDeleteConfirmation = false;
        }

        public ok() {
            this.$scope.showDeleteConfirmation = false;
        }

        public search() {
            this.$scope.searchView = true;
            if (this.$scope.imageStoreTreeSearchTerm === "") {
                this.$scope.showEmptySearchMessage = true;
            } else {
            this.$scope.imagestoreroot.getCompleteDataSet().then(() => {
                this.$scope.imagestoreroot.relevantFolders = this.$scope.imagestoreroot.getFolders(this.$scope.imageStoreTreeSearchTerm);
                this.$scope.imagestoreroot.relevantFiles = this.$scope.imagestoreroot.getFiles(this.$scope.imageStoreTreeSearchTerm);
                if (this.$scope.imagestoreroot.relevantFolders.length === 0 && this.$scope.imagestoreroot.relevantFiles.length === 0) {
                    this.$scope.showEmptySearchMessage = true;
                }else {
                    this.$scope.showEmptySearchMessage = false;
                }
            });
        }
        }
        public reset() {
            this.$scope.searchView = false;
            this.$scope.imagestoreroot.relevantFolders = [];
            this.$scope.imagestoreroot.relevantFiles = [];
        }
        public expandFolder(relativePath: string): void {
            // call service to load sub folders/files
            // this.$scope.imagestoreroot.getCompleteDataSet().then((r: ImageStoreFolder) => {
            //     console.log(this.$scope.imagestoreroot.getFolder("DownloadManagerApp\\DownloadManagerServicePkg\\Code"));
            // });
            // this.$scope.imagestoreroot.getApplicationPackages().then((array) => {
            //     this.$scope.noOfApplicationPackages = array.length;
            //     let tempArray: string[] = [];
            //     let tempSize = 0;
            //     for ( let i = 0; i < array.length; i++) {
            //         tempArray[i] = array[i].Name.replace("fabric:/", "");
            //         tempSize = tempSize + this.$scope.imagestoreroot.getFolderSize(this.$scope.imagestoreroot.getFolder(tempArray[i]));
            //     }
            //     this.$scope.sizeOfAppPackages = this.$scope.imagestoreroot.getDisplayFileSize(tempSize);
            //     console.log(array);
            // });
            // this.$scope.imagestoreroot.getApplicationTypes().then((array) => {
            //     this.$scope.noOfApplicationTypes = array.length;
            //     let tempSize = 0;
            //     console.log(array);
            //     for (let j = 0; j < array.length; j++) {
            //         tempSize = tempSize + this.$scope.imagestoreroot.getFolderSize(this.$scope.imagestoreroot.getFolder("Store\\" + array[j].Name));
            //         this.$scope.sizeOfAppTypes = this.$scope.imagestoreroot.getDisplayFileSize(tempSize);
            //     }
            // });
            console.log(relativePath);
            this.$scope.imagestoreroot.getClickedInfo(relativePath);
            this.$scope.imagestoreroot.retrieveData(relativePath);
            this.$scope.imagestoreroot.getOpenFolders();
            console.log(this.$scope.imagestoreroot.Folders);
        }

        public display(fileCount) {
            this.$scope.displayFileCount = fileCount;
        }
    }
}
