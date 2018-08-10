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
            chaos: "="
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

            $(".dropdown-menu-container").click(function (e) {
                e.stopPropagation();
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
                let timeToRun = this.getTimeSum($("#time-run-d").val(), $("#time-run-h").val(), $("#time-run-m").val());
                let stabilTimeout = this.getTimeSum(0, $("#max-stabilization-h").val(), $("#max-stabilization-m").val());
                let waitIter = this.getTimeSum(0, $("#time-iterations-h").val(), $("#time-iterations-m").val());
                let maxConFaults = $("#concurrent-faults").val();

                let nodeTypeList = [];
                $.each($("input[type='checkbox']:checked"), function(){
                    nodeTypeList.push($(this).val());
                });

                this.$scope.chaos.start(timeToRun, waitIter, stabilTimeout, maxConFaults, nodeTypeList);
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
                button.text("Start chaos").removeClass("stop-chaos-btn").addClass("start-chaos-btn");
            } else if (chaos.status === "Running") {
                button.text("Stop chaos").removeClass("start-chaos-btn").addClass("stop-chaos-btn");
            }
        }

        public getTimeSum(days: number, hours: number, minutes: number) {
            return (this.convertTime(days, "d") + this.convertTime(hours, "h") + this.convertTime(minutes, "m")).toString();
        }

        public convertTime(time: number, measurement: string): number {
            switch (measurement) {
                case "d":
                    time = time * 24 * 3600;
                    break;
                case "h":
                    time = time * 3600;
                    break;
                case "m":
                    time = time * 60;
                    break;
            }
            return time;
        }
    }
}
