module Sfx {
    export class ImageStoreViewController {
        public static $inject = ["$scope", "$timeout", "settings"];
        public constructor(private $scope: any, private $timeout: any, private settings: SettingsService ) {

            this.$scope.fileListSettings = this.settings.getNewOrExistingListSettings("imagestore", ["name"], [
                new ListColumnSetting("", "", null, true, (item: ImageStoreItem, property) => {
                    return `<sfx-image-store-file-view item="item"></sfx-image-store-file-view>`;
                }),
                new ListColumnSetting("displayName", "name", ["isFolder", "displayName"], false, (item: any, property) => {
                    if (!!item["fileCount"]) {
                        return `<div class="image-store-item-name" style="display: inline-block; cursor: pointer; white-space: nowrap;">
                        <a href="" role="button" class="list-item-name" style="display: table-cell;">
                            <span class="bowtie-icon bowtie-folder"></span>
                            <span title="${item.path}">${item.displayName}</span>
                        </a>`;
                    } else {
                        return `<div class="image-store-item-name" style="display: inline-block; cursor: initial; white-space: nowrap;">
                            <span class="bowtie-icon bowtie-file"></span>
                            <span title="${item.path}">${item.displayName}</span>`;
                    };
                }, 1, (item: ImageStoreItem) => {
                        if (item.isFolder === -1) {
                            this.openFolder(item.path);
                        };
                }),
                new ListColumnSetting("displayedSize", "Size", ["isFolder", "size", "displayName"], false, (item: ImageStoreItem, property) => {

                        //First check if its of type File, if so just display the size
                        if (item.isFolder === 1) {
                            return  `<span style="cursor: initial"> ${item.displayedSize} </span>`;
                        }

                        //if its a folder first check if its not loading data
                        const sizeData = this.$scope.imagestoreroot.getCachedFolderSize(item.path);

                        let size = sizeData.size > -1 ? Utils.getFriendlyFileSize(sizeData.size) : "";
                        let loading = sizeData.loading ? "rotate" : "";
                        let date = sizeData.date ? `<span  class="dark-background-link bowtie-icon bowtie-status-waiting-fill" aria-label="timestamp" title="${"Last checked " + sizeData.date.toLocaleString()}"></span>` : "";

                        let loadButton = (size.length === 0 && !loading ) ? `<button type="button" style="background-color: #262626;border: 1px solid #0075c9;"
                                                                                class="checkbox-push">
                                                                                Load Size
                                                                            </button>` :
                                                `<a href class="bowtie-icon bowtie-navigate-refresh dark-background-link ${loading}" title="Reload folder size"></a>`;
                        return "<span style='white-space: nowrap;'>" + date + `<span style="cursor: initial; padding-right: 3px;"> ${size} </span>` + loadButton + "</span>";
                    }, 1, (item) => {
                        if (item.isFolder === -1) {
                            const sizeData = this.$scope.imagestoreroot.getCachedFolderSize(item.path);
                            if (!sizeData.loading) {
                                this.$scope.imagestoreroot.cachedCurrentDirectoryFolderSizes[item.path].loading = true;
                                sizeData.loading = true;
                            }else {
                                return;
                            }

                            this.$scope.imagestoreroot.getFolderSize(item.path).then(size => {
                                this.$scope.imagestoreroot.cachedCurrentDirectoryFolderSizes[item.path] = {size: +size.FolderSize,
                                                                                                            loading: false,
                                                                                                            date: new Date() };
                                item.size = +size.FolderSize;
                                item.displayedSize = Utils.getFriendlyFileSize(+size.FolderSize);
                                this.$scope.imagestoreroot.currentFolder.childrenFolders.find(folder => folder.path === item.path).size = +size.FolderSize;
                                this.$scope.imagestoreroot.allChildren = [].concat(this.$scope.imagestoreroot.allChildren);

                            }).catch( () => {
                                this.$scope.imagestoreroot.cachedCurrentDirectoryFolderSizes[item.path].loading = false;
                            });
                        };
                    }),
                new ListColumnSetting("modifiedDate", "Date modified"),
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

