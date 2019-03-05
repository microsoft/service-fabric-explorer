module Sfx {
    export class ImageStoreViewDirective implements ng.IDirective {
        public restrict = "E";
        public replace = true;
        public controller = ImageStoreViewController;
        public controllerAs = "imageStoreCtrl";
        public templateUrl = "partials/image-store-view.html";
        public scope = {
            imagestoreroot: "="
        };

        public link($scope: any, element: JQuery, attributes: any, ctrl: ImageStoreViewController) {
            $scope.$watch("imagestoreroot", () => {
                if ($scope.content && !angular.isDefined($scope.content.isRefreshing)) {
                }
            });
        }
    }
    export class ImageStoreOptionsViewDirective implements ng.IDirective {
        public restrict = "E";
        // public replace = true;
        public controller = ImageStoreFileViewController;
        public controllerAs = "imageStoreFileCtrl";
        public templateUrl = "partials/image-store-file-view.html";
        public scope = {
            item: "="
        };

        // public link($scope: any, element: JQuery, attributes: any, ctrl: ImageStoreViewController) {
        //     $scope.$watch("item", () => {
        //         if ($scope.content && !angular.isDefined($scope.content.isRefreshing)) {
        //         }
        //     });
        // }
    }
}
