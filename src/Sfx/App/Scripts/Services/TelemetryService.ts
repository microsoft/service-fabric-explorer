//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export interface ITelemetryService {
        isEnabled: boolean;
        trackPageView(): void;
        trackActionEvent(name: string, source: string, result: any): void;
        trackEvent(message: string): void;
    }

    export class TelemetryService implements ITelemetryService {
        public static TelemetryEnabledHostsRegex: RegExp = /(^|\.)azure\.com($|:)/i;
        private static DelayUpdateTimeInSeconds: number = 10;

        public isEnabled: boolean = false;

        private appInsights: any;
        private delayedUpdates: {
            [key: string]: PropertyUpdatePromise
        };

        constructor(
            private $window: any,
            private $interval: angular.IIntervalService,
            private $location: angular.ILocationService,
            private $route: angular.route.IRouteService,
            private storage: StorageService) {

            this.initialize();
        }

        public trackPageView(): void {
            if (!this.isEnabled) {
                return;
            }

            this.noThrowWrapper(() => {
                let pageView = new PageViewRecord(this.$location, this.$route.current);
                if (pageView.url) {
                    this.appInsights.trackPageView(
                        null/* use page title as name */,
                        pageView.url,
                        pageView.properties);
                }
            });
        }

        public trackActionEvent(name: string, source: string, result: any): void {
            if (!this.isEnabled || !source || !name) {
                return;
            }

            this.noThrowWrapper(() => {
                this.appInsights.trackEvent(
                    "Action: " + name,
                    { Result: result, Source: source });
            });
        }

        public trackEvent(message: string): void {
            if (!this.isEnabled || !message) {
                return;
            }

            this.noThrowWrapper(() => {
                this.appInsights.trackEvent(message);
            });
        }

        private initialize() {
            this.delayedUpdates = {};
            this.appInsights = this.$window.appInsights;

            this.isEnabled = this.shouldEnableTelemetry();
            if (this.appInsights) {
                if (this.appInsights.config) {
                    this.appInsights.config.disableTelemetry = !this.isEnabled;
                }
                if (this.appInsights.context && this.appInsights.context.application) {
                    this.appInsights.context.application.ver = VersionInfo.Version;
                    this.appInsights.context.application.build = VersionInfo.Build;
                }
            }
            if (this.isEnabled) {
                this.storage.subscribe((key, oldValue, newValue) => this.storageValueChanged(key, oldValue, newValue));
            }
        }

        private shouldEnableTelemetry(): boolean {
            return this.appInsights && TelemetryService.TelemetryEnabledHostsRegex.test(this.$location.host());
        }

        private trackPropertyChangedEvent(key: string, oldValue: string, newValue: string): void {
            if (!this.isEnabled) {
                return;
            }

            if (this.appInsights && key && oldValue !== newValue) {
                this.noThrowWrapper(() => {
                    this.appInsights.trackEvent(
                        "Property: " + key,
                        { OldValue: oldValue, NewValue: newValue });
                });
            }

            delete this.delayedUpdates[key];
        }

        // Delay some time before sending out telemetry data because:
        //   1. user might change the value multiple times before he/she feels good about it.
        //   2. for some controls like slider and splitter, the value will change multiple times.
        private storageValueChanged(key: string, oldValue: string, newValue: string) {
            if (!this.isEnabled) {
                return;
            }

            this.noThrowWrapper(() => {
                let previousOldValue = oldValue;
                let ongoingUpdate = this.delayedUpdates[key];
                if (ongoingUpdate) {
                    this.$interval.cancel(ongoingUpdate.promise);

                    // the old value should not change from the first update
                    // ignore the old value from intermediate states
                    previousOldValue = ongoingUpdate.oldValue;
                }
                this.delayedUpdates[key] = new PropertyUpdatePromise(previousOldValue, newValue,
                    this.$interval(() => this.trackPropertyChangedEvent(key, previousOldValue, newValue), TelemetryService.DelayUpdateTimeInSeconds * 1000, 1));
            });
        }

        private noThrowWrapper(func: () => void): void {
            try {
                func.apply(this);
            } catch (ex) {
                console.error(ex.toString());
            }
        }
    }

    export class PropertyUpdatePromise {
        constructor(public oldValue: any, public newValue: any, public promise: ng.IPromise<any>) {
        }
    }

    export class PageViewProperties {
        // use capital to be consistent with AppInsights property names
        public IsSecure: boolean;
        public IsLocal: boolean;
        public TabName: string;
    }

    export class PageViewRecord {
        public url: string;
        public properties: PageViewProperties;

        constructor(location: ng.ILocationService, currentRoute: any) {
            if (!currentRoute || !location) {
                return;
            }

            this.properties = new PageViewProperties();

            this.url = currentRoute.loadedTemplateUrl;
            this.properties.IsSecure = location.protocol() && location.protocol().toLowerCase() === "https";
            this.properties.IsLocal = location.host() && location.host().toLowerCase() === "localhost";
            if (currentRoute.params && currentRoute.params.tabId) {
                this.properties.TabName = currentRoute.params.tabId;
            }
        }
    }

    (function () {

        let module = angular.module("telemetryService", ["storageService", "ngRoute"]);
        module.factory("telemetry", ["$window", "$interval", "$location", "$route", "storage",
            ($window, $interval, $location, $route, storage) => new TelemetryService($window, $interval, $location, $route, storage)]);

    })();
}
