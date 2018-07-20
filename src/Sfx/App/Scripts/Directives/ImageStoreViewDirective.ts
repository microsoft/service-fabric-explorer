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
                    //ctrl.updateButton($scope.chaos, $("button.chaos-btn", element));
                }
            });

            // Update the list every time the list has finished refreshing
            $scope.$watch("imagestoreroot.isRefreshing", () => {
                if ($scope.chaos && angular.isDefined($scope.chaos.isRefreshing) && !$scope.chaos.isRefreshing) {
                    //ctrl.updateButton($scope.chaos, $("button.chaos-btn", element));
                }
            });
        }
    }
}
