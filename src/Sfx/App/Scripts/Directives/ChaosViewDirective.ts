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

            // test the clicking of the dropdown to not remove whole dropdown
            $(".dropdown-menu-container").click(function (e) {
                //console.log("Clicked on dropdown menu");
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

                //start chaos with parameters
                //let timeToRun = $("run-for").val();

                //get values from html
                // let measurementVal = $("input[name='runscale']:checked").val();
                // let timeToRun = $("#time").val(); //get the time from the form input
                // let stabilTimeout = $("#stabilization-timeout").val();
                // let waitIter = $("#time-btwn-iterations").val();
                console.log("starting");
                let timeToRun = this.getTimeTotal($("#time-run-d").val(), $("#time-run-h").val(), $("#time-run-m").val());
                let stabilTimeout = this.getTimeTotal(0, $("#max-stabilization-h").val(), $("#max-stabilization-m").val());
                let waitIter = this.getTimeTotal(0, $("#time-iterations-h").val(), $("#time-iterations-m").val());
                let maxConFaults = $("#concurrent-faults").val();

                // gets the checked nodeTypes onto a list
                let nodeTypeList = [];
                $.each($("input[type='checkbox']:checked"), function(){
                    nodeTypeList.push($(this).val());
                });
                console.log("The inclusion list is: " + nodeTypeList);

                console.log("time to run: " + timeToRun);
                console.log("stabilization timeout: " + stabilTimeout);
                console.log("time btwn iterations: " + waitIter);
                console.log("max concurrent faults: " + maxConFaults);

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

        // Finds the sum in seconds from the selected days, hours, and minutes
        public getTimeTotal(days: number, hours: number, minutes: number) {
            return (this.convertTime(days, "d") + this.convertTime(hours, "h") + this.convertTime(minutes, "m")).toString();
        }

        // Converts days, hours, or minutes to seconds
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
