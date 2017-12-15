//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

module Sfx {
    export interface IMetricsViewScope extends angular.IScope {
        metrics: IMetricsViewModel;
    }

    export interface IMetricsViewModel {
        filteredNodeLoadInformation: NodeLoadInformation[];
        selectedMetrics: LoadMetricInformation[];
        metrics: LoadMetricInformation[];
        filteredMetrics: LoadMetricInformation[];
        systemMetrics: LoadMetricInformation[];
        metricsWithCapacities: LoadMetricInformation[];
        metricsWithoutCapacities: LoadMetricInformation[];
        showSystemMetrics: boolean;
        normalizeMetricsData: boolean;
        refreshToken: number;
        isExpanderEnabled: boolean;
        isFullScreen: boolean;
        refresh(): void;
        getLegendColor(value: string): string;
    }

    export class MetricsViewModel implements IMetricsViewModel {
        public _showSystemMetrics: boolean = false;
        public _normalizeMetricsData: boolean = true;
        public refreshToken: number = 0;
        public isExpanderEnabled: boolean = false;
        public isFullScreen: boolean = false;

        private legendColorPalette = d3.scale.ordinal<string>()
            .range(["#71b252", "#ff8418", "#FCB714", "#903F8B", "#3f5fb6", "#79D7F2", "#B5B5B5", "#8c564b"]);

        public get filteredNodeLoadInformation(): NodeLoadInformation[] {
            if (this.selectedMetrics.length > 0) {
                if (_.first(this.selectedMetrics).hasCapacity) {
                    // If selected metric has capacity defined only display nodes with non-zero capacity defined or non-zero load reported
                    return _.filter(this.nodesLoadInformation, nli => {
                        return nli.isInitialized && _.some(nli.nodeLoadMetricInformation, lmi => _.some(this.selectedMetrics, m => m.name === lmi.name && (+lmi.raw.NodeCapacity !== -1 || +lmi.raw.NodeLoad > 0)));
                    });
                } else {
                    // If selected metric has no capacity defined return all initialized nodes
                    return _.filter(this.nodesLoadInformation, nli => nli.isInitialized);
                }
            } else {
                return [];
            }
        }

        public get metrics(): LoadMetricInformation[] {
            return this.clusterLoadInformation.loadMetricInformation;
        }

        public get filteredMetrics(): LoadMetricInformation[] {
            return _.filter(this.clusterLoadInformation.loadMetricInformation, m => this.showSystemMetrics || !m.isSystemMetric);
        }

        public get metricsWithCapacities(): LoadMetricInformation[] {
            return _.filter(this.metrics, m => !m.isSystemMetric && m.hasCapacity);
        }

        public get metricsWithoutCapacities(): LoadMetricInformation[] {
            return _.filter(this.metrics, m => !m.isSystemMetric && !m.hasCapacity);
        }

        public get systemMetrics(): LoadMetricInformation[] {
            return _.filter(this.metrics, m => m.isSystemMetric);
        }

        public get selectedMetrics(): LoadMetricInformation[] {
            return _.filter(this.metrics, m => m.selected);
        }

        public get showSystemMetrics(): boolean {
            return this._showSystemMetrics;
        }

        public set showSystemMetrics(value: boolean) {
            this._showSystemMetrics = value;
            if (!value) {
                this.selectedMetrics.forEach(m => {
                    if (m.isSystemMetric) { m.selected = false; }
                });

                this.refresh();
            }
        }

        public get normalizeMetricsData(): boolean {
            return this._normalizeMetricsData;
        }

        public set normalizeMetricsData(value: boolean) {
            this._normalizeMetricsData = value;
            this.refresh();
        }

        public refresh(): void {
            this.refreshToken = (this.refreshToken + 1) % 10000;
        }

        public getLegendColor(value: string): string {
            return this.legendColorPalette(value);
        }

        public toggleMetric(metric: LoadMetricInformation) {
            this.metrics.forEach(m => m.selected = false);
            metric.selected = true;
            this.refresh();
        }

        public toggleFullScreen(fullScreen: boolean) {
            if (this.isFullScreen !== fullScreen) {
                this.isFullScreen = fullScreen;
                this.refresh();
            }
        }

        constructor(
            private clusterLoadInformation: ClusterLoadInformation,
            private nodesLoadInformation: NodeLoadInformation[]) {

            // Select default capacity
            if (this.metricsWithCapacities.length > 0) {
                this.metricsWithCapacities[0].selected = true;
            } else if (this.metricsWithoutCapacities.length > 0) {
                this.metricsWithoutCapacities[0].selected = true;
            } else if (this.systemMetrics.length > 0) {
                this.showSystemMetrics = true;
                this.systemMetrics[0].selected = true;
            }
        }
    }
}
