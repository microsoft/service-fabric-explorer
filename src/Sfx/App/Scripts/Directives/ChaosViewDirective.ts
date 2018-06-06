//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    interface IChaosComponentBindings {
        chaos: Chaos;
        functionBinding: () => any;
    }

    interface IChaosComponentController extends IChaosComponentBindings {
        handleClick(event: any): void;
    }

    class ChaosViewController implements IChaosComponentController {
        static $inject = ["$scope", "$element", "$attrs"];
        public chaos: Chaos;
        $doCheck: any;
        $postLink: any;
        public functionBinding: () => any;

        constructor($scope: any, $element: JQuery, $attrs: any) {
            let button = $("button", $element);

            this.$postLink = function () {
                this.updateButton(this.chaos, button);
            };

            this.$doCheck = function () {
                    this.updateButton(this.chaos, button);
            };
        }

        handleClick(event: any): void {
            //this.functionBinding();

            let $button = $(event.target);
            $button.prop("disabled", true);
            if (this.chaos.status === "Stopped") {
                this.chaos.start();
                $button.text("Starting chaos...");
            }

            if (this.chaos.status === "Running") {
                this.chaos.stop();
                $button.text("Stopping chaos...");
            }
        }

        public updateButton(chaos: Chaos, button: JQuery): void {
            button.prop("disabled", false);

            if (chaos.status === "Stopped") {
                button.text("START CHAOS").removeClass("stop-chaos-btn").addClass("start-chaos-btn");
            } else {
                button.text("STOP CHAOS").removeClass("start-chaos-btn").addClass("stop-chaos-btn");
            }
        }
    }

    class ChaosComponent implements ng.IComponentOptions {

        public bindings: any;
        public controller: any;
        public templateUrl: string;

        constructor() {
            this.bindings = {
                chaos: "<",
                functionBinding: "&"
            };
            this.controller = ChaosViewController;
            this.templateUrl = "partials/chaos-view.html";
        }
    }

    angular.module("sfx").component("sfxChaos", new ChaosComponent());

    // export class ChaosViewDirective implements ng.IDirective {
    //     public restrict = "E";
    //     public replace = true;
    //     public controller = ChaosViewController;
    //     public controllerAs = "ctrl";
    //     public templateUrl = "partials/chaos-view.html";
    //     public scope = {
    //         chaos: "=",
    //         settings: "="
    //     };

    //     public link($scope: any, element: JQuery, attributes: any, ctrl: ChaosViewController) {
    //         $scope.$watch("chaos", () => {
    //             if ($scope.chaos && !angular.isDefined($scope.chaos.isRefreshing)) {

    //                 ctrl.updateButton($scope.chaos, $("button.chaos-btn", element));
    //             }
    //         });

    //         // Update the list every time the list has finished refreshing
    //         $scope.$watch("chaos.isRefreshing", () => {
    //             if ($scope.chaos && angular.isDefined($scope.chaos.isRefreshing) && !$scope.chaos.isRefreshing) {

    //                 ctrl.updateButton($scope.chaos, $("button.chaos-btn", element));
    //             }
    //         });
    //     }
    // }

    // export class ChaosViewController {

    //     public chaos: Chaos;
    //     public handleClick: any;

    //     public constructor() {
    //         console.log("controller constructor");

    //         this.handleClick = function (event: any): void {
    //             let $button = $(event.target);
    //             $button.prop("disabled", true);
    //             if (this.chaos.status === "Stopped") {
    //                 this.chaos.start();
    //                 $button.text("Starting chaos...");
    //             }

    //             if (this.chaos.status === "Running") {
    //                 this.chaos.stop();
    //                 $button.text("Stopping chaos...");
    //             }
    //         };
    //     }

    //     public updateButton(chaos: any, button: JQuery): void {
    //         button.prop("disabled", false);

    //         if (chaos.status === "Stopped") {
    //             button.text("START CHAOS").removeClass("stop-chaos-btn").addClass("start-chaos-btn");
    //         } else {
    //             button.text("STOP CHAOS").removeClass("start-chaos-btn").addClass("stop-chaos-btn");
    //         }
    //     }

    // public getChaosEventsListSettings() {
    //     return this.$scope.listSettings;
    // }

    // private getSortedFilteredList(): any[] {
    //     let list = this.$scope.list.collection || this.$scope.list;
    //     if (_.isEmpty(list)) {
    //         return list;
    //     }

    //     if (this.$scope.listSettings.hasEnabledFilters || this.$scope.listSettings.search) {

    //         // Retrieve text values of all columns for searching and filtering
    //         let pluckedList = _.map(list, item => {
    //             let pluckedObj = this.$scope.listSettings.getPluckedObject(item);
    //             // Preserve the original object, property start with $ will be ignored by anguler filter
    //             pluckedObj["$originalItem"] = item;
    //             return pluckedObj;
    //         });

    //         // Retrieve the original objects from filtered plucked object list
    //         list = _.map(pluckedList, pluckedObj => pluckedObj["$originalItem"]);
    //     }

    //     return list;
    // }
    //}
}
