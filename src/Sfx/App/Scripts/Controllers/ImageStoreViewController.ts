module Sfx {
    export class ImageStoreViewController {
        public static $inject = ["$scope", "$timeout"];
        public constructor(private $scope: any, private $timeout: any) {
        }

        public deleteSelected(itemName: string) {
            this.$scope.showDeleteConfirmation = true;
            this.$scope.itemName = itemName;
            this.$scope.confirmationKeyword = itemName;
        }

        public deleteCanceled() {
            this.$scope.showDeleteConfirmation = false;
            this.$scope.imageStoreTreeSearchTerm = "";
        }

        public deleteConfirmed() {
            this.$scope.imagestoreroot.deleteFolder(this.$scope.confirmationKeyword);
            this.$scope.showDeleteConfirmation = false;
        }

        public search() {
            if (!this.$scope.imageStoreTreeSearchTerm) {
                return false;
            }

            this.$scope.searchView = true;
            this.$scope.loader = true;
            this.$scope.imagestoreroot.search(this.$scope.imageStoreTreeSearchTerm).then(() => {
                this.$scope.loader = false;
                if (this.$scope.imagestoreroot.relevantFolders.length === 0 && this.$scope.imagestoreroot.relevantFiles.length === 0) {
                    this.$scope.showEmptySearchMessage = true;
                } else {
                    this.$scope.showEmptySearchMessage = false;
                }
            });
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
    }
}
