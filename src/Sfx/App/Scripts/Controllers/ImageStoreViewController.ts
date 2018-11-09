module Sfx {
    export class ImageStoreViewController {
        public static $inject = ["$scope", "$timeout"];
        public constructor(private $scope: any, private $timeout: any) {
        }

        public deleteSelected(itemPath: string) {
            this.$scope.showDeleteConfirmation = true;
            this.$scope.confirmationKeyword = itemPath;
        }

        public deleteCanceled() {
            this.$scope.showDeleteConfirmation = false;
            this.$scope.imageStoreTreeSearchTerm = "";
            this.$scope.usertypedkeyword = "";
        }

        public deleteConfirmed() {
            this.$scope.imagestoreroot.deleteContent(this.$scope.confirmationKeyword);
            this.$scope.usertypedkeyword = "";
            this.$scope.showDeleteConfirmation = false;
        }

        public openFolder(relativePath: string): void {
            this.$scope.imagestoreroot.expandFolder(relativePath);
        }
    }
}
