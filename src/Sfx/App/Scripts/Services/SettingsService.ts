//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export class SettingsService {
        private listSettings: _.Dictionary<ListSettings>;
        private _paginationLimit: number;
        private _metricsViewModel: IMetricsViewModel;

        public get paginationLimit(): number {
            return this._paginationLimit;
        }

        public set paginationLimit(limit: number) {            
            if (!limit) {
                return;
            }
            if (limit < Constants.PaginationLimitMin) {
                limit = Constants.PaginationLimitMin;
            } else if (limit > Constants.PaginationLimitMax) {
                limit = Constants.PaginationLimitMax;
            }
            this._paginationLimit = limit;
            this.storage.setValue(Constants.PaginationLimitStorageKey, limit);
            this.updatePaginationLimit(limit);
        }

        public constructor(private $location: angular.ILocationService, private storage: StorageService) {
            this.listSettings = {};
            this._paginationLimit = storage.getValueNumber(Constants.PaginationLimitStorageKey, Constants.DefaultPaginationLimit);
        }

        public getNewOrExistingMetricsViewModel(clusterLoadInformation: ClusterLoadInformation, nodesLoadInformation: NodeLoadInformation[]): IMetricsViewModel {
            if (!this._metricsViewModel) {
                this._metricsViewModel = new MetricsViewModel(clusterLoadInformation, nodesLoadInformation);
            }
            return this._metricsViewModel;
        }

        public getNewOrExistingListSettings(
            listName: string,
            defaultSortProperties: string[] = [],
            columnSettings: ListColumnSetting[] = [],
            secondRowColumnSettings: ListColumnSetting[] = [],
            secondRowCollapsible: boolean = false,
            showSecondRow: (item) => boolean = (item) => true,
            searchable: boolean = true) {

            // Use URL + listName as unique key to track list settings on detail pages
            let key: string = this.$location.path() + "/" + listName;
            if (!this.listSettings[key]) {
                this.listSettings[key] = new ListSettings(this.paginationLimit, defaultSortProperties, columnSettings, secondRowColumnSettings, secondRowCollapsible, showSecondRow, searchable);
            }
            return this.listSettings[key];
        }

        public getNewOrExistingTreeNodeListSettings(
            listKey: string,
            defaultSortProperties: string[] = [],
            columnSettings: ListColumnSetting[] = []) {

            if (!this.listSettings[listKey]) {
                this.listSettings[listKey] = new ListSettings(this.paginationLimit, defaultSortProperties, columnSettings);
            }
            return this.listSettings[listKey];
        }

        public getNewOrExistingUnhealthyEvaluationsListSettings(listKey: string = "unhealthyEvaluations") {
            return this.getNewOrExistingListSettings(listKey, null,
                [
                    new ListColumnSetting("kind", "Kind", null, false, (item) => HtmlUtils.getSpanWithCustomClass("preserve-whitespace", item.kind)),
                    new ListColumnSettingForBadge("healthState", "Health State"),
                    new ListColumnSetting("description", "Description", null, false, (item) => HtmlUtils.getSpanWithCustomClass("preserve-whitespace-wrap", item.description))
                ]);
        }

        public getNewOrExistingHealthEventsListSettings(listKey: string = "healthEvents") {
            return this.getNewOrExistingListSettings(listKey, ["raw.SequenceNumber"],
                [
                    new ListColumnSettingForBadge("healthState", "Health State"),
                    new ListColumnSetting("raw.SourceId", "Source"),
                    new ListColumnSetting("raw.Property", "Property"),
                    new ListColumnSetting("sourceUtcTimestamp", "Source UTC"),
                    new ListColumnSetting("TTL", "TTL"),
                    new ListColumnSetting("raw.SequenceNumber", "Sequence Number"),
                    new ListColumnSetting("raw.RemoveWhenExpired", "Remove When Expired"),
                    new ListColumnSetting("raw.IsExpired", "Is Expired")
                ],
                // Second row with description
                [
                    new ListColumnSetting("placeholder", "placeholder", null, false), // Empty column
                    new ListColumnSetting("description", "Description", null, false, (item) => HtmlUtils.getSpanWithCustomClass("preserve-whitespace-wrap", item.description), 100)
                ]);
        }

        // Update all existing list settings to use new limit
        private updatePaginationLimit(limit: number): void {
            _.forEach(this.listSettings, (item) => {
                item.currentPage = 1;
                item.limit = limit;
            });
        }
    }

    (function () {

        let module = angular.module("settingsService", ["storageService"]);
        module.factory("settings", ["$location", "storage", ($location, storage) => new SettingsService($location, storage)]);

    })();
}
