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
            $scope.startDate = $scope.eventsList.startDate;
            $scope.endDate = $scope.eventsList.endDate;
        }
    }
}
