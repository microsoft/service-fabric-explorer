import { LoadMetricInformation } from "../Models/DataModels/Shared";
import { NodeLoadInformation } from '../Models/DataModels/Node';
import { ListSettings } from '../Models/ListSettings';
import { ClusterLoadInformation } from '../Models/DataModels/Cluster';
import { scaleOrdinal } from 'd3';

//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
// export interface IMetricsViewScope extends angular.IScope { // TODO USE FOR METRIC VIEW COMPONENT
//     metrics: IMetricsViewModel;
//     listSettings: SettingsService;
//     tableSettings: ListSettings;
//     tableData: any[];
// }

export interface IMetricsViewModel {
    filteredNodeLoadInformation: NodeLoadInformation[];
    selectedMetrics: LoadMetricInformation[];
    metrics: LoadMetricInformation[];
    filteredMetrics: LoadMetricInformation[];
    systemMetrics: LoadMetricInformation[];
    metricsWithCapacities: LoadMetricInformation[];
    metricsWithoutCapacities: LoadMetricInformation[];
    showResourceGovernanceMetrics: boolean;
    showLoadMetrics: boolean;
    showSystemMetrics: boolean;
    normalizeMetricsData: boolean;
    refreshToken: number;
    isExpanderEnabled: boolean;
    isFullScreen: boolean;
    refresh(): void;
    getLegendColor(value: string): string;
}

export class MetricsViewModel implements IMetricsViewModel {
    public _showResourceGovernanceMetrics: boolean = true;
    public _showLoadMetrics: boolean = true;
    public _showSystemMetrics: boolean = false;
    public _normalizeMetricsData: boolean = true;
    public refreshToken: number = 0;
    public isExpanderEnabled: boolean = false;
    public isFullScreen: boolean = false;

    private _metrics: LoadMetricInformation[] = null;
    private legendColorPalette = scaleOrdinal<string>()
        .range(["#71b252", "#ff8418", "#FCB714", "#903F8B", "#3f5fb6", "#79D7F2", "#B5B5B5", "#8c564b"]);

    private static ensureResourceGovernanceMetrics(metrics: LoadMetricInformation[]): LoadMetricInformation[] {
        let cpuCapacityAvailable: boolean = false;
        let memoryCapacityAvailable: boolean = false;
        let metricsWithResourceGov: LoadMetricInformation[] = metrics.map(m => {
            if (m.name === "servicefabric:/_CpuCores") {
                cpuCapacityAvailable = true;
            } else if (m.name === "servicefabric:/_MemoryInMB") {
                memoryCapacityAvailable = true;
            }
            return m;
        });
        if (!cpuCapacityAvailable) {
            let zeroCpuCapacity: LoadMetricInformation = new LoadMetricInformation(null, {
                Name: "servicefabric:/_CpuCores",
                IsBalancedBefore: true,
                IsBalancedAfter: true,
                DeviationBefore: "",
                DeviationAfter: "",
                BalancingThreshold: "",
                Action: "",
                ActivityThreshold: "",
                ClusterCapacity: 0,
                ClusterLoad: 0,
                CurrentClusterLoad: 0,
                RemainingUnbufferedCapacity: 0,
                NodeBufferPercentage: 0,
                BufferedCapacity: 0,
                RemainingBufferedCapacity: 0,
                IsClusterCapacityViolation: false,
                MinNodeLoadValue: 0,
                MinNodeLoadId: null,
                MaxNodeLoadValue: 0,
                MaxNodeLoadId: null
            });
            metricsWithResourceGov.unshift(zeroCpuCapacity);
        }
        if (!memoryCapacityAvailable) {
            let zeroMemoryCapacity: LoadMetricInformation = new LoadMetricInformation(null, {
                Name: "servicefabric:/_MemoryInMB",
                IsBalancedBefore: true,
                IsBalancedAfter: true,
                DeviationBefore: "",
                DeviationAfter: "",
                BalancingThreshold: "",
                Action: "",
                ActivityThreshold: "",
                ClusterCapacity: 0,
                ClusterLoad: 0,
                CurrentClusterLoad: 0,
                RemainingUnbufferedCapacity: 0,
                NodeBufferPercentage: 0,
                BufferedCapacity: 0,
                RemainingBufferedCapacity: 0,
                IsClusterCapacityViolation: false,
                MinNodeLoadValue: 0,
                MinNodeLoadId: null,
                MaxNodeLoadValue: 0,
                MaxNodeLoadId: null
            });
            metricsWithResourceGov.unshift(zeroMemoryCapacity);
        }
        return metricsWithResourceGov;
    }

    public get filteredNodeLoadInformation(): NodeLoadInformation[] {
        if (this.selectedMetrics.length > 0) {
            if (this.selectedMetrics[0].hasCapacity) {
                // If selected metric has capacity defined only display nodes with non-zero capacity defined or non-zero load reported
                return this.nodesLoadInformation.filter(nli => {
                    return nli.isInitialized && nli.nodeLoadMetricInformation.some(lmi => this.selectedMetrics.some(m => m.name === lmi.name && (+lmi.raw.NodeCapacity !== -1 || +lmi.raw.NodeLoad > 0)));
                });
            } else {
                // If selected metric has no capacity defined return all initialized nodes
                return this.nodesLoadInformation.filter(nli => nli.isInitialized);
            }
        } else {
            return [];
        }
    }

    public get metrics(): LoadMetricInformation[] {
        if (this._metrics == null) {
            // Copy list of metrics and append zero CPU/Memory allocated capacities if info not available
            this._metrics = MetricsViewModel.ensureResourceGovernanceMetrics(this.clusterLoadInformation.loadMetricInformation);
        }
        return this._metrics;
    }

    public get filteredMetrics(): LoadMetricInformation[] {
        return this.metrics.filter(m => {
            if (m.isSystemMetric) {
                return this.showSystemMetrics;
            } else if (m.isResourceGovernanceMetric) {
                return this.showResourceGovernanceMetrics;
            } else {
                return this.showLoadMetrics;
            }
        });
    }

    public get metricsWithCapacities(): LoadMetricInformation[] {
        return this.metrics.filter(m => !m.isSystemMetric && m.hasCapacity);
    }

    public get metricsWithoutCapacities(): LoadMetricInformation[] {
        return this.metrics.filter(m => !m.isSystemMetric && !m.hasCapacity);
    }

    public get systemMetrics(): LoadMetricInformation[] {
        return this.metrics.filter(m => m.isSystemMetric);
    }

    public get selectedMetrics(): LoadMetricInformation[] {
        return this.metrics.filter(m => m.selected);
    }

    public get showResourceGovernanceMetrics(): boolean {
        return this._showResourceGovernanceMetrics;
    }

    public set showResourceGovernanceMetrics(value: boolean) {
        this._showResourceGovernanceMetrics = value;
        if (!value) {
            this.refresh();
        }
    }

    public get showLoadMetrics(): boolean {
        return this._showLoadMetrics;
    }

    public set showLoadMetrics(value: boolean) {
        this._showLoadMetrics = value;
        if (!value) {
            this.refresh();
        }
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
        // Clear copied list of metrics
        this._metrics = null;
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

