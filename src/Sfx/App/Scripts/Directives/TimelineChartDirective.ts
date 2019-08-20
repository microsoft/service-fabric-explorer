//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    // {label: "person a", times: [{"color":"green", "label":"Weeee", "starting_time": 1355752800000, "ending_time": 1355759900000}, {"color":"blue", "label":"Weeee", "starting_time": 1355767900000, "ending_time": 1355774400000}]},


    // export interface ITimeLineRow {
    //     label: string;
    //     times: ITimeLinwRowEntry[];
    // }
    
    // export interface ITimeLinwRowEntry {
    //     label: string;
    //     starting_time: number;
    //     ending_time: number;
    //     color?: string;
    //     data?: any;
    // }

    export class TimeLineChartDirective implements ng.IDirective {
        public restrict = "E";
        public replace = true;
        public controller = TimeLineChartController;
        public controllerAs = "ctrl";
        public templateUrl = "partials/timeline.html";
        public scope = {
            events: "=",
        };
        public transclude = true;

        public link($scope: any, element: JQuery, attributes: any, ctrl: TimeLineChartController) {
            // The list passed in can be a normal array or a DataModelCollection object.
            // When it is a normal array, the directive only updates when the list reference
            // itself is changed or any items are added/removed from the list.
            // The health events and unhealthy evaluations list references are changed
            // every time they are refreshed. That is why the contents of this directive
            // are always up-to-date.
            // When it is a DataModelCollection list, list.isRefreshing will be watched so
            // we know exactly when to refresh the list.
            $scope.$watchCollection("events", () => {
                // Only update if list is a normal array since the DataModelCollection will be updated
                // via the isRefreshing watcher below and we don't want to update the list twice.
                if ($scope.events) {
                    ctrl.updateList($scope.events);
                }
            });
        }
    }

    export class TimeLineChartController {
        public static $inject = ["$scope"];

        private _timeline: vis.Timeline;
        private _start: Date;
        private _end: Date;

        public constructor(public $scope: any) {

            let groups = new vis.DataSet();

            let items = new vis.DataSet([
              ]);
            // create visualization
            let container = document.getElementById('visualization');
            let options = {
                stackSubgroups: false,
                tooltip: {
                    overflowMethod: 'flip'
                }

            };

            console.log(groups);
            console.log(items);
            this._timeline = new vis.Timeline(container, items, groups);
        }

        public fitData() {
            this._timeline.fit();
        }

        public fitWindow() {
            this._timeline.setWindow(this._start, this._end);
        }

        public moveStart(){
            this._timeline.moveTo(this._start)
        }
        
        public moveEnd(){
            this._timeline.moveTo(this._end)
        }

        public updateList(events: ITimelineData) {
            if (events) {
                console.log(events);
                this._timeline.setData({
                    groups: events.groups,
                    items: events.items
                  })
                this._timeline.setOptions({
                    selectable: false,
                    min: events.start,
                    max: events.end,
                    margin: {
                        item : {
                            horizontal : -1
                        }
                    }
                })
                this._timeline.fit();

                this._start = events.start;
                this._end = events.end;
            }
        }

        public handleClickRow(item: any, event: any): void {
            if (event && event.target !== event.currentTarget) { return; }

        }

    }
}