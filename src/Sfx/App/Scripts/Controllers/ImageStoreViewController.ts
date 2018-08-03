
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

        public expandFolder(relativePath: string): void {
            // call service to load sub folders/files
            // this.$scope.imagestoreroot.getCompleteDataSet().then((r: ImageStoreFolder) => {
            //     console.log(this.$scope.imagestoreroot.getFolder("DownloadManagerApp\\DownloadManagerServicePkg\\Code"));
            // });
            this.$scope.imagestoreroot.getNoOfApplicationPackages().then((array) => this.$scope.noOfApplicationPackages = array.length);
            this.$scope.imagestoreroot.getNoOfApplicationTypes().then((array) => this.$scope.noOfApplicationTypes = array.length);
            this.$scope.imagestoreroot.getClickedInfo(relativePath);
            this.$scope.imagestoreroot.retrieveData(relativePath);
            this.$scope.imagestoreroot.getOpenFolders();
        }

        public display(fileCount) {
            this.$scope.displayFileCount = fileCount;
        }
    }
}
