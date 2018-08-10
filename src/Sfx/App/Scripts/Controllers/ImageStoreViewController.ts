
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


        public checkIfReserved (name: string) {
            if (name.indexOf("Store") !== -1 || name.indexOf("WindowsFabricStore") !== -1) {
                this.$scope.notReserved = false;
            } else {
                this.$scope.notReserved = true;
            }
        }

        public search() {
            this.$scope.searchView = true;
            this.$scope.loader = true;
            if (this.$scope.imageStoreTreeSearchTerm === "") {
                this.$scope.showEmptySearchMessage = true;
            } else {
                this.$scope.imagestoreroot.getCompleteDataSet().then(() => {
                    this.$scope.loader = false;
                    this.$scope.imagestoreroot.relevantFolders = this.$scope.imagestoreroot.getFolders(this.$scope.imageStoreTreeSearchTerm);
                    this.$scope.imagestoreroot.relevantFiles = this.$scope.imagestoreroot.getFiles(this.$scope.imageStoreTreeSearchTerm);
                    if (this.$scope.imagestoreroot.relevantFolders.length === 0 && this.$scope.imagestoreroot.relevantFiles.length === 0) {
                        this.$scope.showEmptySearchMessage = true;
                    } else {
                        this.$scope.showEmptySearchMessage = false;
                    }
                });
            }
        }

        public reset() {
            this.$scope.searchView = false;
            this.$scope.imageStoreTreeSearchTerm = "";
            this.$scope.imagestoreroot.relevantFolders = [];
            this.$scope.imagestoreroot.relevantFiles = [];
        }

        public onFolderClick(relativePath: string, isExpandingFolder: boolean): void {
            isExpandingFolder ? this.$scope.imagestoreroot.expandFolder(relativePath) : this.$scope.imagestoreroot.closeFolder(relativePath);
        }

        public display(fileCount) {
            this.$scope.displayFileCount = fileCount;
        }
    }
}
