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
                    ctrl.updateList();

                    ctrl.updateButton($scope.chaos, $("button.chaos-btn", element));
                }
            });

            // Update the list every time the list has finished refreshing
            $scope.$watch("chaos.isRefreshing", () => {
                if ($scope.chaos && angular.isDefined($scope.chaos.isRefreshing) && !$scope.chaos.isRefreshing) {
                    ctrl.updateList();

                    ctrl.updateButton($scope.chaos, $("button.chaos-btn", element));
                }
            });
        }
    }

    export class ChaosViewController {
        public static $inject = ["$scope"];

        public constructor(private $scope: any) {
        }

        public updateButton(chaos: any, button: JQuery): void {
            button.prop("disabled", false);

            if (chaos.status === "Stopped") {
                button.text("START CHAOS").removeClass("stop-chaos-btn").addClass("start-chaos-btn");
            } else {
                button.text("STOP CHAOS").removeClass("start-chaos-btn").addClass("stop-chaos-btn");
            }
        }

        public updateList() {
            if (this.$scope.chaos) {
            }
        }

        public handleClick(event: any): void {
            $(event.target).prop("disabled", true);

            if (this.$scope.chaos.status === "Stopped") {
                this.$scope.chaos.start();
            }

            if (this.$scope.chaos.status === "Running") {
                this.$scope.chaos.stop();
            }
        }

        public getChaosEventsListSettings() {
            return this.$scope.listSettings;
        }

        private getSortedFilteredList(): any[] {
            let list = this.$scope.list.collection || this.$scope.list;
            if (_.isEmpty(list)) {
                return list;
            }

            if (this.$scope.listSettings.hasEnabledFilters || this.$scope.listSettings.search) {

                // Retrieve text values of all columns for searching and filtering
                let pluckedList = _.map(list, item => {
                    let pluckedObj = this.$scope.listSettings.getPluckedObject(item);
                    // Preserve the original object, property start with $ will be ignored by anguler filter
                    pluckedObj["$originalItem"] = item;
                    return pluckedObj;
                });

                // Retrieve the original objects from filtered plucked object list
                list = _.map(pluckedList, pluckedObj => pluckedObj["$originalItem"]);
            }

            return list;
        }
    }
}
