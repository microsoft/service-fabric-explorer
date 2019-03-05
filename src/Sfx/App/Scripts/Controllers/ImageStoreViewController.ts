module Sfx {
    export class ImageStoreViewController {
        public static $inject = ["$scope", "$timeout", "settings"];
        public constructor(private $scope: any, private $timeout: any, private settings: SettingsService ) {
            console.log(this.$scope.imagestoreroot);
            console.log(this.settings);
            
            this.$scope.imagestoresFilesettings = this.settings.getNewOrExistingListSettings('imagestoreFiles');
            this.$scope.imagestoresettings = this.settings.getNewOrExistingListSettings('imagestoreFolders');
            console.log(this.$scope.imagestoresettings);
            this.$scope.fileListSettings = this.settings.getNewOrExistingListSettings("imagestore", ["name"], [
                new ListColumnSetting("", "", null, true, (item: ImageStoreItem, property) => {  
                    return `<sfx-image-store-file-view item="item"></sfx-image-store-file-view>`
                    }),
                new ListColumnSetting("displayName", "name", null, true, (item: any, property) => {
                    if(!!item['fileCount']){
                        return `<div class="image-store-item-name" style="display: inline-block;">
                        <a href="" role="button" class="list-item-name" style="display: table-cell;">
                            <span class="bowtie-icon bowtie-folder"></span>
                            <span title="${item.path}">${item.displayName}</span>
                        </a>`
                    }else{
                        return `<div class="image-store-item-name" style="display: inline-block; cursor: initial;">
                            <span class="bowtie-icon bowtie-file"></span>
                            <span title="${item.path}">${item.displayName}</span>`
                    }
                
                    }, 1, 
                    (item: ImageStoreItem) => {
                        if(!!item['fileCount']){
                            this.openFolder(item.path)
                        }
                    }),
                new ListColumnSetting("displayedSize", "Size", null, true, (item: ImageStoreItem, property) => {
                        return  `<span style="cursor: initial"> ${item.displayedSize || ''} </span>`;

                        //First check if its of type File, if so just display the size
                        if(item['fileCount'] === undefined){
                            return  `<span style="cursor: initial"> ${item.displayedSize} </span>`;
                        }
                        //if its a folder first check if its not loading data
                        const sizeData = this.$scope.imagestoreroot.getCachedFolderSize(item.path);
                        
                        let size = sizeData.size ? Utils.getFriendlyFileSize(sizeData.size) : '';
                        let loading = sizeData.loading ? 'rotate' : '';

                        return `<span style="cursor: initial"> ${size} </span>` + `<a href class="bowtie-icon bowtie-navigate-refresh dark-background-link ${loading}" title="load file size"></a>`;

                    },1, (item) => {
                        if(!!item['fileCount']){
                            
                            const sizeData = this.$scope.imagestoreroot.getCachedFolderSize(item.path);

                            if(!sizeData.loading){
                                sizeData.loading = true;
                            }

                            // let sizeData = this.$scope.imagestoreroot.cachedCurrentDirectoryFolderSizes[item.path];

                            // if(sizeData && !sizeData.loading){
                            //     sizeData.loading = true;
                            // }else if(!sizeData ){
                            //     sizeData = {size: null, loading: true }
                            //     this.$scope.imagestoreroot.cachedCurrentDirectoryFolderSizes[item.path] = sizeData;
                            // }

                            item.uniqueId = item.uniqueId + sizeData.loading.toString();
                            this.$scope.imagestoreroot.loadFolderSize(item.path).then(size => {
                                
                                this.$scope.imagestoreroot.cachedCurrentDirectoryFolderSizes[item.path] = {size: size, loading: false };
                                item.size = size;
                                item.displayedSize = Utils.getFriendlyFileSize(size);
                                item.uniqueId = item.uniqueId + 'false';
                            })
                        }
                    } ),
                new ListColumnSetting("modifiedDate", "Date modified"),
                new ListColumnSetting("version", "File version"),
                new ListColumnSetting("fileCount", "Count of Files")
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

