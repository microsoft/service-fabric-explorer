//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

module Sfx {

    export class RefreshService {
        public isRefreshing: boolean = false;
        private autoRefreshInterval: angular.IPromise<any> = null;
        private previousRefreshSetting = 0;

        constructor(
            private $rootScope: angular.IRootScopeService,
            private $interval: angular.IIntervalService,
            private $q: angular.IQService,
            private $timeout: angular.ITimeoutService,
            private controllerManager: ControllerManagerService,
            private storage: StorageService,
            private clusterTree: ClusterTreeService,
            private data: DataService) {
        }

        // AuthenticationController will call this function to initialize the tree view once authentication is cleared
        public init(): void {
            let defaultRefreshInterval = this.storage.getValueNumber(
                Constants.AutoRefreshIntervalStorageKey,
                Constants.DefaultAutoRefreshInterval);

            this.updateRefreshInterval(Constants.AutoRefreshIntervalStorageKey, defaultRefreshInterval.toString(), true /* no refresh */);

            this.storage.subscribe((key, oldInterval, newInterval) => this.updateRefreshInterval(key, newInterval));
        }

        public refreshAll(): void {
            if (this.isRefreshing) {
                return;
            }

            this.data.invalidateBrowserRestResponseCache();

            let refreshStartedTime = Date.now();
            this.isRefreshing = true;

            this.$q.all([this.clusterTree.refresh(), this.controllerManager.refreshCurrentControllers()]).finally(() => {
                // Rotate the refreshing icon for at least 1 second
                let remainingTime = Math.max(1000 - (Date.now() - refreshStartedTime), 0);
                this.$timeout(() => {
                    this.isRefreshing = false;
                }, remainingTime);
            });
        }

        private updateRefreshInterval(key: string, interval: string, noRefresh: boolean = false): void {
            if (key !== Constants.AutoRefreshIntervalStorageKey) {
                return;
            }

            if (this.autoRefreshInterval) {
                this.$interval.cancel(this.autoRefreshInterval);
                this.autoRefreshInterval = null;
            }

            let newInterval: number = parseInt(interval, 10);

            if (newInterval === 0) {
                console.log("Turned off auto refresh");
            } else {
                console.log("Auto refresh interval = " + newInterval + " seconds");
                this.autoRefreshInterval = this.$interval(() => this.refreshAll(), newInterval * 1000);

                if (!noRefresh && (this.previousRefreshSetting === 0 || newInterval < this.previousRefreshSetting)) {
                    this.refreshAll();
                }
            }

            this.previousRefreshSetting = newInterval;
        }
    }

    (function () {

        let module = angular.module("refreshService", ["clusterTreeService", "dataService", "storageService", "controllerManagerService"]);
        module.factory("refresh", ["$rootScope", "$interval", "$q", "$timeout", "controllerManager", "storage", "clusterTree", "data",
            ($rootScope, $interval, $q, $timeout, controllerManager, storage, clusterTree, data) => new RefreshService($rootScope, $interval, $q, $timeout, controllerManager, storage, clusterTree, data)]);

    })();
}
