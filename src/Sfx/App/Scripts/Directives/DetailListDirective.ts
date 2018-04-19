//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export class DetailListDirective implements ng.IDirective {
        public restrict = "E";
        public replace = true;
        public controller = DetailListController;
        public controllerAs = "ctrl";
        public templateUrl = "partials/detail-list.html";
        public scope = {
            list: "=",
            listSettings: "="
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
            $scope.$watchCollection("list", () => {
                // Only update if list is a normal array since the DataModelCollection will be updated
                // via the isRefreshing watcher below and we don't want to update the list twice.
                if ($scope.list && !angular.isDefined($scope.list.isRefreshing)) {
                    ctrl.updateList();
                }
            });

            $scope.$watch("list.isInitialized", (newVal, oldVal) => {
                //When isInitialized becomes false which means it got cleared.
                if ($scope.list && newVal === false && oldVal === true) {
                    ctrl.updateList();
                }
            });

            // Update the list every time the list has finished refreshing
            $scope.$watch("list.isRefreshing", () => {
                if ($scope.list && angular.isDefined($scope.list.isRefreshing) && !$scope.list.isRefreshing) {
                    ctrl.updateList();
                }
            });

            // Watch search keyword, the sort and filter will be controlled on view through controller
            $scope.$watch("listSettings.search", () => {
                ctrl.updateList();
            });
        }
    }

    export class DetailListController {
        public static $inject = ["$filter", "$scope"];

        public constructor(private $filter: angular.IFilterService, private $scope: any) {
        }

        public updateList() {
            if (this.$scope.list) {
                this.$scope.sortedFilteredList = this.getSortedFilteredList();
                this.$scope.listSettings.count = this.$scope.sortedFilteredList.length;
            }
        }

        public handleClickRow(item: any): void {
            if (this.$scope.listSettings.secondRowCollapsible) {
                item.isSecondRowCollapsed = !item.isSecondRowCollapsed;
            }
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

                // Filter on columns and update filters based on new list
                pluckedList = this.filterOnColumns(pluckedList, this.$scope.listSettings);

                // Search
                if (this.$scope.listSettings.search) {
                    let keywords = this.$scope.listSettings.search.trim().split(/\s+/);

                    _.forEach(keywords, keyword => {
                        pluckedList = this.$filter("filter")(pluckedList, keyword);
                    });
                }

                // Retrieve the original objects from filtered plucked object list
                list = _.map(pluckedList, pluckedObj => pluckedObj["$originalItem"]);
            }

            // Sort
            if (!_.isEmpty(this.$scope.listSettings.sortPropertyPaths)) {
                list = this.$filter("orderBy")(
                    list,
                    this.$scope.listSettings.sortPropertyPaths,
                    this.$scope.listSettings.sortReverse);
            }

            return list;
        }

        private filterOnColumns(pluckedList: any, listSettings: ListSettings): any {

            // Initialize the filter array, false indicate filtered, true indicate not filtered
            let filterMark: boolean[] = new Array(pluckedList.length);
            _.fill(filterMark, true);

            // Update each column filter values by scanning through the list and found out all unique values exist in current column
            _.forEach(listSettings.columnSettings, (columnSetting: ListColumnSetting) => {
                if (!columnSetting.enableFilter) {
                    return;
                }

                // If any filter value is unchecked, we need to filter on this column
                let hasEffectiveFilters = _.some(columnSetting.filterValues, filterValue => !filterValue.isChecked);
                let checkedValues = _.map(_.filter(columnSetting.filterValues, filterValue => filterValue.isChecked), "value");

                // Update filter values in each column and filter the list at the same time
                columnSetting.filterValues =
                    _.sortBy( // Sort alphabetically
                        _.union( // Union with original filters, user may already set filter on them, should not overwrite
                            _.map( // Create new filters
                                _.filter( // Get rid of those values already in the filters
                                    _.uniq( // Get all unique property values in current column
                                        _.filter( // Get rid of empty values
                                            _.map( // Get all property values in current column
                                                pluckedList,
                                                (item, index) => {
                                                    let targetPropertyTextValue = item[columnSetting.propertyPath];
                                                    filterMark[index] = filterMark[index] // Not already filtered
                                                        && (!hasEffectiveFilters // No effective filters
                                                            || !targetPropertyTextValue // Target value is empty, no filters apply
                                                            || _.includes(checkedValues, targetPropertyTextValue)); // The checked values include the target value
                                                    return targetPropertyTextValue;
                                                }
                                            ),
                                            value => !_.isEmpty(value)
                                        )
                                    ),
                                    value => _.every(columnSetting.filterValues, filterValue => filterValue.value !== value)
                                ),
                                value => new FilterValue(value)
                            ),
                            columnSetting.filterValues
                        ),
                        "value"
                    );
            });

            pluckedList = _.filter(pluckedList, (item, index) => filterMark[index]);
            return pluckedList;
        }
    }
}
