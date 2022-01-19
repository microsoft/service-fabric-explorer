import { LoadMetricInformation } from '../Models/DataModels/Shared';
import { Node, NodeLoadInformation } from '../Models/DataModels/Node';
import { ClusterLoadInformation } from '../Models/DataModels/Cluster';

// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

export interface IMetricsViewModel {
    selectedMetrics: LoadMetricInformation[];
    metrics: LoadMetricInformation[];
    systemMetrics: LoadMetricInformation[];
    metricsWithCapacities: LoadMetricInformation[];
    metricsWithoutCapacities: LoadMetricInformation[];
    normalizeMetricsData: boolean;
    filteredNodeLoadInformation(node: Node[]): NodeLoadInformation[];
    refresh(): void;
    getLegendColor(value: string): string;
}

export class MetricsViewModel implements IMetricsViewModel {
    public iShowResourceGovernanceMetrics = true;
    public iShowLoadMetrics = true;
    public iShowSystemMetrics = false;
    public iNormalizeMetricsData = true;

    public metricsWithCapacities = [];
    public metricsWithoutCapacities = [];
    public systemMetrics = [];

    private iMetrics: LoadMetricInformation[] = null;

    private static ensureResourceGovernanceMetrics(metrics: LoadMetricInformation[]): LoadMetricInformation[] {
        let cpuCapacityAvailable = false;
        let memoryCapacityAvailable = false;
        const metricsWithResourceGov: LoadMetricInformation[] = metrics.map(m => {
            if (m.name === 'servicefabric:/_CpuCores') {
                cpuCapacityAvailable = true;
            } else if (m.name === 'servicefabric:/_MemoryInMB') {
                memoryCapacityAvailable = true;
            }
            return m;
        });
        if (!cpuCapacityAvailable) {
            const zeroCpuCapacity: LoadMetricInformation = new LoadMetricInformation(null, {
                Name: 'servicefabric:/_CpuCores',
                IsBalancedBefore: true,
                IsBalancedAfter: true,
                DeviationBefore: '',
                DeviationAfter: '',
                BalancingThreshold: '',
                Action: '',
                ActivityThreshold: '',
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
            const zeroMemoryCapacity: LoadMetricInformation = new LoadMetricInformation(null, {
                Name: 'servicefabric:/_MemoryInMB',
                IsBalancedBefore: true,
                IsBalancedAfter: true,
                DeviationBefore: '',
                DeviationAfter: '',
                BalancingThreshold: '',
                Action: '',
                ActivityThreshold: '',
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

    public filteredNodeLoadInformation(nodes: Node[]): NodeLoadInformation[] {
        if (this.selectedMetrics.length > 0) {
            if (this.selectedMetrics[0].hasCapacity) {
                // If selected metric has capacity defined only display nodes with non-zero capacity defined or non-zero load reported
                return nodes.filter(node => {
                    const nli = node.loadInformation;
                    // tslint:disable-next-line:max-line-length
                    return nli.isInitialized && nli.nodeLoadMetricInformation.some(lmi => this.selectedMetrics.some(m => m.name === lmi.name && (+lmi.raw.NodeCapacity !== -1 || +lmi.raw.NodeLoad > 0)));
                }).map(node => node.loadInformation);
            } else {
                // If selected metric has no capacity defined return all initialized nodes
                return nodes.map(node => node.loadInformation).filter(nli => nli.isInitialized);
            }
        } else {
            return [];
        }
    }

    public get metrics(): LoadMetricInformation[] {
        if (this.iMetrics == null) {
            // Copy list of metrics and append zero CPU/Memory allocated capacities if info not available
            this.iMetrics = MetricsViewModel.ensureResourceGovernanceMetrics(this.clusterLoadInformation.loadMetricInformation);
        }
        return this.iMetrics;
    }

    public get selectedMetrics(): LoadMetricInformation[] {
        return this.metrics.filter(m => m.selected);
    }

    public get normalizeMetricsData(): boolean {
        return this.iNormalizeMetricsData;
    }

    public set normalizeMetricsData(value: boolean) {
        this.iNormalizeMetricsData = value;
        this.refresh();
    }

    public refresh(): void {
      this.metricsWithCapacities = this.metrics.filter(m => !m.isSystemMetric && m.hasCapacity);
      this.metricsWithoutCapacities = this.metrics.filter(m => !m.isSystemMetric && !m.hasCapacity);
      this.systemMetrics = this.metrics.filter(m => m.isSystemMetric);
        // this.refreshToken = (this.refreshToken + 1) % 10000;
        // Clear copied list of metrics
        this.iMetrics = null;
    }

    public toggleMetric(metric: LoadMetricInformation, type: LoadMetricInformation[]) {
        metric.selected = !metric.selected;
        this.selectedMetrics.forEach(selectedMetric => {
          if(!type.includes(selectedMetric)) {
            selectedMetric.selected = false;
          }
        })

        this.refresh();
    }

    constructor(
        private clusterLoadInformation: ClusterLoadInformation) {
    }

    public getLegendColor(value: string): string {
      return '#ff8418';
    }
}
