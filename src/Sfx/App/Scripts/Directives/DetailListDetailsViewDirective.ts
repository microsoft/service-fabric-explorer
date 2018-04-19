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
            $scope.parentController = ctrl;
            $scope.detailsList = null;

            $scope.parentController.showDetails = (itemId: string) => {
                let parentList = $scope.parentController.$scope.list;
                if (parentList) {
                    let parentListItems = parentList.collection || parentList;
                    let matchItems = parentListItems.filter(item => (item.uniqueId === itemId));
                    if (matchItems.length === 1) {
                        $scope.detailsList = parentList.getDetailsList(matchItems[0]);
                        $scope.detailsList.refresh();
                    }
                }
            };

            $scope.goBack = () => {
                $scope.detailsList = null;
            };
        }
    }
}
