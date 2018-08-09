
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
                    } else {
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

        public onFolderClick(relativePath: string, isExpendingFolder: boolean): void {
            isExpendingFolder ? this.$scope.imagestoreroot.expandFolder(relativePath) : this.$scope.imagestoreroot.closeFolder(relativePath);
        }

        public display(fileCount) {
            this.$scope.displayFileCount = fileCount;
        }
    }
}
