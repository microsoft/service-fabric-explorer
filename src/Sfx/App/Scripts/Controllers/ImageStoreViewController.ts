module Sfx {
    export class ImageStoreViewController {
        public static $inject = ["$scope", "$timeout", "settings"];
        public constructor(private $scope: any, private $timeout: any, private settings: SettingsService ) {

            this.$scope.imagestoresFilesettings = this.settings.getNewOrExistingListSettings("imagestoreFiles");
            this.$scope.imagestoresettings = this.settings.getNewOrExistingListSettings("imagestoreFolders");
            this.$scope.fileListSettings = this.settings.getNewOrExistingListSettings("imagestore", ["name"], [
                new ListColumnSetting("", "", null, true, (item: ImageStoreItem, property) => {
                    return `<sfx-image-store-file-view item="item"></sfx-image-store-file-view>`;
                }),
                new ListColumnSetting("displayName", "name", ["isFolder", "displayName"], false, (item: any, property) => {
                    if (!!item["fileCount"]) {
                        return `<div class="image-store-item-name" style="display: inline-block;">
                        <a href="" role="button" class="list-item-name" style="display: table-cell;">
                            <span class="bowtie-icon bowtie-folder"></span>
                            <span title="${item.path}">${item.displayName}</span>
                        </a>`;
                    } else {
                        return `<div class="image-store-item-name" style="display: inline-block; cursor: initial;">
                            <span class="bowtie-icon bowtie-file"></span>
                            <span title="${item.path}">${item.displayName}</span>`;
                    };
                }, 1, (item: ImageStoreItem) => {
                        if (!!item["fileCount"]) {
                            this.openFolder(item.path);
                        };
                }),
                new ListColumnSetting("displayedSize", "Size", ["isFolder", "size", "displayName"], false, (item: ImageStoreItem, property) => {
                        return  `<span style="cursor: initial"> ${item.displayedSize || ""} </span>`;
                    }),
                new ListColumnSetting("modifiedDate", "Date modified"),
                new ListColumnSetting("version", "File version"),
                new ListColumnSetting("fileCount", "Count of Files", ["isFolder", "fileCount"])
            ]);
        }


        public openFolder(relativePath: string): void {
            this.$scope.imagestoreroot.expandFolder(relativePath);
        }
    }

    export class ImageStoreFileViewController {
        public static $inject = ["$scope", "data"];
        public constructor(private $scope: any, private data: DataService) {

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
            this.data.imageStore.deleteContent(this.$scope.confirmationKeyword);
            this.$scope.usertypedkeyword = "";
            this.$scope.showDeleteConfirmation = false;
        }

    }
}

