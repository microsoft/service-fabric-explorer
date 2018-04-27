//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {
    export interface IEventsViewScope extends angular.IScope {
        eventsList: EventListBase<any>;
        startDate: Date;
        endDate: Date;
    }

    export class EventsViewDirective implements ng.IDirective {
        public restrict = "E";
        public templateUrl = "partials/events-view.html";
        public scope = {
            eventsList: "="
        };

        public link($scope: any, element: JQuery, attributes: any) {

            $scope.reset = (readDateWindow: boolean = true) => {
                if (readDateWindow) {
                    $scope.startDate = $scope.eventsList.startDate;
                    $scope.endDate = $scope.eventsList.endDate;
                }

                $scope.startDateMax = $scope.endDateMax = new Date(); //Today
                $scope.startDateMin = $scope.endDateMin = null;
                $scope.isStartSelected = $scope.isEndSelected = false;
            };

            $scope.$watch("startDate", () => {
                if (!$scope.isEndSelected) {
                    $scope.endDateMin = $scope.startDate;
                    $scope.endDateMax = TimeUtils.AddDays($scope.startDate, 7);
                    if ($scope.endDateMax > new Date()) {
                        $scope.endDateMax = new Date();
                    }
                    $scope.isStartSelected = true;
                } else {
                    $scope.eventsList.setDateWindow($scope.startDate, $scope.endDate);
                    $scope.reset(false);
                }
            });

            $scope.$watch("endDate", () => {
                if (!$scope.isStartSelected) {
                    $scope.startDateMax = $scope.endDate;
                    $scope.startDateMin = TimeUtils.AddDays($scope.endDate, -7);
                    $scope.isEndSelected = true;
                } else {
                    $scope.eventsList.setDateWindow($scope.startDate, $scope.endDate);
                    $scope.reset(false);
                }
            });

            $scope.resetClick = () => {
                $scope.eventsList.resetDateWindow();
                $scope.reset();
            };

            $scope.reset();
        }
    }
}
