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

        //adriana added
        public measurement = "s";

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

            //gets everything that has the name 'runscale' from the 'element' view, radio buttons
            $("input[name='runscale']", element).change((e) => {
                //console.log($(e.target).val());
                this.measurement = $(e.target).val();
                //console.log(this.measurement);
            });
        }
    }

    export class ChaosViewController {
        public static $inject = ["$scope", "$timeout"];
        
        //public timeMeasurement = "s"; //added adriana

        public constructor(private $scope: any, private $timeout: any) {
        }

        public handleClick(event: any): void {
            let $button = $(event.target);

            $button.prop("disabled", true);
            if (this.$scope.chaos.status === "Stopped") {

                //start chaos with parameters
                //let timeToRun = $("run-for").val();
                let timeToRun = $("input:number"); //get the time from the form input

                //do conversions
                //console.log(timeToRun);
                this.$scope.chaos.start(timeToRun);
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
    }
}
