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

        }
    }

    export class StatusWarningController {
        static $inject = ["$scope", "data"];

        alerts: StatusWarningService;

        displayAll = false;

        constructor(private $scope: any, private data: DataService) {
            this.alerts = this.data.warnings;
        }

        public toggleViewed(): void {
            this.displayAll = !this.displayAll;
        }

        public remove(alert: IStatusWarning, hidePermenantly = false): void {
            this.alerts.removeNotificationById(alert.id, hidePermenantly);
        }

        public removeWithConfirm(alert: IStatusWarning): void {
            new ActionWithConfirmationDialog(
                this.data.$uibModal,
                this.data.$q,
                "",
                "Accept",
                "acknowledge",
                () => this.data.$q.when(this.alerts.removeNotificationById(alert.id, true)),
                () => true,
                "Acknowledge",
                alert.confirmText,
                "Accept").runWithCallbacks( () => null, () => {});

        }

    }
}
