//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

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

            $scope.$watchCollection("events", () => {

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
        private _oldestEvent: vis.DataItem;
        private _mostRecentEvent: vis.DataItem;

        public constructor(public $scope: any) {

            let groups = new vis.DataSet();

            let items = new vis.DataSet();
            // create visualization
            let container = document.getElementById("visualization");

            this._timeline = new vis.Timeline(container, items, groups);
        }

        public fitData() {
            this._timeline.fit();
        }

        public fitWindow() {
            this._timeline.setWindow(this._start, this._end);
        }

        public moveStart() {
            this._timeline.moveTo(this._start);
        }

        public moveEnd() {
            this._timeline.moveTo(this._end);
        }

        public moveToOldestEvent() {
            if (this._oldestEvent) {
                this._timeline.setWindow(this._oldestEvent.start, this._oldestEvent.end);
            }
        }

        public moveToNewestEvent() {
            if (this._mostRecentEvent) {
                this._timeline.setWindow(this._mostRecentEvent.start, this._mostRecentEvent.end);
            }
        }

        public updateList(events: ITimelineData) {
            if (events) {
                this._timeline.setData({
                    groups: events.groups,
                    items: events.items
                  });
                this._timeline.setOptions(<any>{
                    selectable: false,
                    min: events.start,
                    max: events.end,
                    margin: {
                        item : {
                            horizontal : -1 //this makes it so items dont stack up when zoomed out too far.,
                        }
                    },
                    stack: true,
                    stackSubgroups: true,
                    maxHeight: '700px',
                    verticalScroll: true,
                    width: '95%',
                    tooltip : {
                        overflowMethod: "flip"
                    },
                });
                this._timeline.fit();

                this._start = events.start;
                this._end = events.end;

                if (events.items.length > 0) {
                    let oldest = null;
                    let newest = null;

                    events.items.forEach(item => {
                        //cant easily grab the first elements of the collection, easier to set here
                        if (!oldest  && !newest) {
                            oldest = item;
                            newest = item;
                        }
                        if (oldest.start > item.start) {
                            oldest = item;
                        }
                        if (newest.end < item.end) {
                            newest = item;
                        }
                    });
                    this._mostRecentEvent = newest;
                    this._oldestEvent = oldest;
                }
            }else {
                this._mostRecentEvent = null;
                this._oldestEvent = null;
            }
        }

    }
}
