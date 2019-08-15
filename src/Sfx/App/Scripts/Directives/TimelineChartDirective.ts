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

        public link($scope: any, element: JQuery, attributes: any, ctrl: DetailListController) {
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
                if ($scope.list) {
                    ctrl.updateList();
                }
            });
        }
    }

    export class TimeLineChartController {
        public static $inject = ["$scope"];

        private _timeline: vis.Timeline;

        public constructor(public $scope: any) {
            var groupCount = 3;
            // create a data set with groups
            var names = ['Upgrade Domains', 'Cluster Upgrade', "Cluster Health"];
            var groups = new vis.DataSet();
            for (var g = 0; g < groupCount; g++) {
              groups.add({id: names[g], content: names[g]});
            }
            // create a dataset with items
            let items = new vis.DataSet([
                {id: 1, content: 'V 6.5.562.234', start: '2014-04-14', end: '2014-04-19', group: "Cluster Upgrade", type: 'range'},
                {id: 2, content: '0', start: '2014-04-14', end: '2014-04-15',group: "Upgrade Domains", type: 'range', title: '<div class="tooltip-test">start: 2014-04-14 <br> end: 2014-05-15 <br> description: UD was in progress</div>'},
                {id: 3, content: '1', start: '2014-04-16', end: '2014-04-17',group: "Upgrade Domains", type: 'range'},
                {id: 4, content: '2', start: '2014-04-18', end: '2014-04-19', group: "Upgrade Domains", type: 'range', className: 'red'},
                {id: 5, content: 'V 6.5.562.234', start: '2014-03-14', end: '2014-03-19', group: "Cluster Upgrade", type: 'range'},
                {id: 6, content: '0', start: '2014-03-14', end: '2014-03-15',group: "Upgrade Domains", type: 'range', title: '<div class="tooltip-test">start: 2014-04-14 <br> end: 2014-05-15 <br> description: UD was in progress</div>'},
                {id: 7, content: '1', start: '2014-03-16', end: '2014-03-17',group: "Upgrade Domains", type: 'range'},
                {id: 8, content: '2', start: '2014-03-18', end: '2014-03-19', group: "Upgrade Domains", type: 'range', className: 'red'},
                {id: 'A', content: 'OK', start: '2014-04-14',  className: 'green', group: "Cluster Health"},
                {id: 'B', content: 'Error', start: '2014-04-17', className: 'red', group: "Cluster Health"}
              ]);
            // create visualization
            let container = document.getElementById('visualization');
            let options = {
                max: '2014-4-20',
                min: '2014-3-10'
            };

            console.log(groups);
            console.log(items);
            this._timeline = new vis.Timeline(container, items, groups, options);

            setTimeout( () => {
                [
                    {id: 1, content: 'V 6.5.562.234', start: '2014-04-14', end: '2014-04-19', group: "Cluster Upgrade", type: 'range'},
                    {id: 2, content: '0', start: '2014-04-14', end: '2014-04-15',group: "Upgrade Domains", type: 'range', title: '<div class="tooltip-test">start: 2014-04-14 <br> end: 2014-05-15 <br> description: UD was in progress</div>'},
                    {id: 3, content: '1', start: '2014-04-16', end: '2014-04-17',group: "Upgrade Domains", type: 'range'},
                    {id: 4, content: '2', start: '2014-04-18', end: '2014-04-19', group: "Upgrade Domains", type: 'range', className: 'red'}, 
                    {id: 'A', content: 'OK', start: '2014-04-14',  className: 'green', group: "Cluster Health"},
                    {id: 'B', content: 'Error', start: '2014-04-17', className: 'red', group: "Cluster Health"}
                ].forEach( (item ) => {
                    items.remove(item.id);
                })
                this._timeline.fit();
            }, 5000)
        }

        public updateList() {
            if (this.$scope.list) {
                //this.$scope.sortedFilteredList = this.getSortedFilteredList();
                this.$scope.listSettings.count = this.$scope.sortedFilteredList.length;
            }
        }

        public handleClickRow(item: any, event: any): void {
            if (event && event.target !== event.currentTarget) { return; }

        }

    }
}