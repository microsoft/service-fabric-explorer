//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {
    export class ChaosViewDirective implements ng.IDirective {
        public restrict = "E";
        public replace = true;
        public controller = ChaosViewController;
        public controllerAs = "ctrl";
        public templateUrl = "partials/chaos-view.html";
        public scope = {
            chaos: "=",
            settings: "="
        };

        public link($scope: any, element: JQuery, attributes: any, ctrl: ChaosViewController) {
            $scope.$watch("chaos", () => {
                if ($scope.chaos && !angular.isDefined($scope.chaos.isRefreshing)) {

                    ctrl.updateButton($scope.chaos, $("button.chaos-btn", element));
                }
            });

            // Update the list every time the list has finished refreshing
            $scope.$watch("chaos.isRefreshing", () => {
                if ($scope.chaos && angular.isDefined($scope.chaos.isRefreshing) && !$scope.chaos.isRefreshing) {

                    ctrl.updateButton($scope.chaos, $("button.chaos-btn", element));
                }
            });
        }
    }

    export class ChaosViewController {
        public static $inject = ["$scope", "$timeout"];

        public constructor(private $scope: any, private $timeout: any) {
        }

        public handleClick(event: any): void {
            let $button = $(event.target);
            $button.prop("disabled", true);
            if (this.$scope.chaos.status === "Stopped") {
                this.$scope.chaos.start();
                $button.text("Starting chaos...");
            }

            if (this.$scope.chaos.status === "Running") {
                this.$scope.chaos.stop();
                $button.text("Stopping chaos...");
            }

            this.$timeout(() => { this.$scope.chaos.refresh(); }, 5000);
        }

        public updateButton(chaos: any, button: JQuery): void {
            button.prop("disabled", false);

            if (chaos.status === "Stopped") {
                button.text("START CHAOS").removeClass("stop-chaos-btn").addClass("start-chaos-btn");
            } else {
                button.text("STOP CHAOS").removeClass("start-chaos-btn").addClass("stop-chaos-btn");
            }
        }
    }
}
