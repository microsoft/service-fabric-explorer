import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { EMPTY, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Chart, PointOptionsObject, SeriesLineOptions, chart } from 'highcharts';
import { ResponseMessageHandlers } from 'src/app/Common/ResponseMessageHandlers';
import {
  FabricProcessResourceUsageMetric,
  FABRIC_PROCESS_RESOURCE_USAGE_LOOKBACK_MS,
  IFabricProcessResourceUsageNodeSeries,
  formatFabricProcessResourceBytes,
  getFabricProcessResourceUsageSeriesByNode,
  getTopFabricProcessResourceUsageNodeSeries
} from 'src/app/Models/eventstore/FabricProcessResourceUsage';
import { VisualizationComponent, VisUpdateData } from 'src/app/modules/event-store/visualizationComponents';
import { DataService } from 'src/app/services/data.service';
import { createFabricProcessResourceUsageChartOptions } from 'src/app/modules/event-store/fabric-process-resource-usage-chart';

@Component({
  selector: 'app-cluster-resource-usage-visualization',
  templateUrl: './resource-usage-visualization.component.html',
  styleUrls: ['./resource-usage-visualization.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class ClusterResourceUsageVisualizationComponent implements VisualizationComponent, AfterViewInit, OnDestroy {
  private static readonly maxNodeSeries = 10;
  private static readonly maxClusterNodeCount = 50;
  private static readonly colors = [
    '#4da3ff', '#58b8a9', '#f0a35e', '#dc6d7d', '#a78bca',
    '#d5bd5b', '#5eb4d1', '#df86bf', '#8fba62', '#c58b63'
  ];

  private data = inject(DataService);

  @ViewChild('cpuChartContainer') private cpuChartContainer!: ElementRef;
  @ViewChild('memoryChartContainer') private memoryChartContainer!: ElementRef;

  loading = false;
  failed = false;
  rangeLimited = false;
  sampleCount = 0;
  observedNodeCount = 0;
  clusterNodeCount = 0;
  clusterTooLarge = false;
  nodeCountUnavailable = false;

  private cpuChart?: Chart;
  private memoryChart?: Chart;
  private loadSubscription?: Subscription;
  private loadKey?: string;
  private isDestroyed = false;
  private startDate = new Date();
  private endDate = new Date();
  private cpuSeries: IFabricProcessResourceUsageNodeSeries[] = [];
  private memorySeries: IFabricProcessResourceUsageNodeSeries[] = [];

  ngAfterViewInit(): void {
    this.cpuChart = chart(this.cpuChartContainer.nativeElement, createFabricProcessResourceUsageChartOptions([]));
    this.memoryChart = chart(this.memoryChartContainer.nativeElement, createFabricProcessResourceUsageChartOptions([]));
    this.renderCharts();
  }

  update(data: VisUpdateData): void {
    if (this.isDestroyed) {
      return;
    }

    const loadKey = `${data.startDate.getTime()}\0${data.endDate.getTime()}`;
    if (this.loadKey === loadKey && this.loadSubscription && !this.loadSubscription.closed) {
      return;
    }

    this.loadKey = loadKey;
    this.endDate = data.endDate;
    const earliestStartDate = new Date(this.endDate.getTime() - FABRIC_PROCESS_RESOURCE_USAGE_LOOKBACK_MS);
    this.startDate = data.startDate > earliestStartDate ? data.startDate : earliestStartDate;
    this.rangeLimited = this.startDate.getTime() > data.startDate.getTime();
    this.loadSubscription?.unsubscribe();
    this.nodeCountUnavailable = false;
    this.clusterTooLarge = false;
    this.clear(false);
    this.loading = true;

    this.loadSubscription = this.data.getNodes(
      false,
      ResponseMessageHandlers.silentResponseMessageHandler
    ).pipe(
      switchMap(nodes => {
        if (!nodes.isInitialized || !nodes.lastRefreshWasSuccessful) {
          this.nodeCountUnavailable = true;
          this.loading = false;
          return EMPTY;
        }

        this.clusterNodeCount = nodes.collection.length;
        this.clusterTooLarge = this.clusterNodeCount > ClusterResourceUsageVisualizationComponent.maxClusterNodeCount;
        if (this.clusterTooLarge) {
          this.loading = false;
          return EMPTY;
        }

        return this.data.restClient.getNodeEvents(
          this.startDate,
          this.endDate,
          undefined,
          ['FabricProcessResourceUsage'],
          ResponseMessageHandlers.silentResponseMessageHandler
        );
      })
    ).subscribe({
      next: events => {
        const nodeSeries = getFabricProcessResourceUsageSeriesByNode(events, this.startDate, this.endDate);
        this.cpuSeries = getTopFabricProcessResourceUsageNodeSeries(
          nodeSeries,
          'cpuPercent',
          ClusterResourceUsageVisualizationComponent.maxNodeSeries
        );
        this.memorySeries = getTopFabricProcessResourceUsageNodeSeries(
          nodeSeries,
          'memoryPercent',
          ClusterResourceUsageVisualizationComponent.maxNodeSeries
        );
        this.sampleCount = nodeSeries.reduce((count, item) => count + item.samples.length, 0);
        this.observedNodeCount = nodeSeries.length;
        this.loading = false;
        this.renderCharts();
      },
      error: () => this.clear(true)
    });
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    this.loadSubscription?.unsubscribe();
    this.loadKey = undefined;
    this.cpuChart?.destroy();
    this.memoryChart?.destroy();
    this.cpuChart = undefined;
    this.memoryChart = undefined;
  }

  private clear(failed: boolean): void {
    this.cpuSeries = [];
    this.memorySeries = [];
    this.sampleCount = 0;
    this.observedNodeCount = 0;
    this.loading = false;
    this.failed = failed;
    this.renderCharts();
  }

  private renderCharts(): void {
    this.renderChart(this.cpuChart, this.cpuSeries, 'cpuPercent');
    this.renderChart(this.memoryChart, this.memorySeries, 'memoryPercent');
  }

  private renderChart(
    targetChart: Chart | undefined,
    nodeSeries: IFabricProcessResourceUsageNodeSeries[],
    metric: FabricProcessResourceUsageMetric
  ): void {
    if (!targetChart) {
      return;
    }

    while (targetChart.series.length > 0) {
      targetChart.series[0].remove(false);
    }

    nodeSeries.forEach((item, index) => {
      const data: PointOptionsObject[] = item.samples.map(sample => ({
        x: sample.timestamp.getTime(),
        y: sample[metric],
        custom: {
          detail: metric === 'memoryPercent'
            ? ` (${formatFabricProcessResourceBytes(sample.memoryRssBytes)} of ${formatFabricProcessResourceBytes(sample.memoryTotalBytes)})`
            : ''
        }
      }));
      const series: SeriesLineOptions = {
        type: 'line',
        name: item.nodeName,
        color: ClusterResourceUsageVisualizationComponent.colors[index],
        data
      };
      targetChart.addSeries(series, false);
    });

    targetChart.xAxis[0].setExtremes(this.startDate.getTime(), this.endDate.getTime(), false);
    targetChart.redraw();
  }
}