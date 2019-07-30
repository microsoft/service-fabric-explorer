//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {
    export interface IEventsViewScope extends angular.IScope {
        dataService: DataService;
    }

    export class StatusWarningsDirective implements ng.IDirective {
        public restrict = "E";
        public templateUrl = "partials/status-warnings.html";
        public controller = StatusWarningController;
        public controllerAs = "ctrl";
        public scope = {
            dataService: "="
        };

        public link($scope: any, element: JQuery, attributes: any) {
            // $scope.dwSelector = new DateWindowSelector($scope.eventsList);
            // $scope.resetClick = () => {
            //     $scope.dwSelector.reset();
            // };
        }
    }

    export class StatusWarningController {
        static $inject = ["$scope", "data"];

        clusterUpgradeProgress: ClusterUpgradeProgress;
        alerts: StatusWarningService;

        displayAll = false;

        constructor(private $scope: any, private data: DataService) {
            this.clusterUpgradeProgress = this.data.clusterUpgradeProgress;
            console.log(this.data.warnings.notifications);
            this.alerts = this.data.warnings;
        }

        public toggleViewed(): void {
            this.displayAll = !this.displayAll;
        }

    }
}
