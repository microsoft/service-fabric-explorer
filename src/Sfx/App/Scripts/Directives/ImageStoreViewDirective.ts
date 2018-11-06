module Sfx {
    export class ImageStoreViewDirective implements ng.IDirective {
        public restrict = "E";
        public replace = true;
        public controller = ImageStoreViewController;
        public controllerAs = "ctrl";
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
}
