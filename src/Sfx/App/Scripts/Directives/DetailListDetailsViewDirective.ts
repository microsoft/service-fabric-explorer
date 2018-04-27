//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export class DetailListDetailsViewDirective implements ng.IDirective {
        public restrict = "E";
        public templateUrl = "partials/detail-list-details-view.html";
        public scope = {
            detailsListSettings: "="
        };
        public require = "^sfxDetailList";

        public link($scope: any, element: JQuery, attributes: any, ctrl: DetailListController) {
            ctrl.$scope.showDetails = (itemId: string) => {
                let parentList = ctrl.$scope.list;
                if (parentList && parentList.getDetailsList) {
                    let parentListItems = parentList.collection || parentList;
                    let matchItems = parentListItems.filter(
                        (item) => (item.uniqueId === itemId || item.id === itemId));
                    if (matchItems.length === 1) {
                        $scope.itemName = matchItems[0].name || null;
                        $scope.detailsList = parentList.getDetailsList(matchItems[0]);
                        $scope.detailsList.refresh();
                    }
                }
            };

            $scope.reset = () => {
                $scope.itemName = null;
                $scope.detailsList = null;
            };

            $scope.goBack = () => {
                $scope.reset();
            };
        }
    }
}
