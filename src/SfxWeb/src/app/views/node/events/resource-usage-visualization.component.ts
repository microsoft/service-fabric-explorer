import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { Chart, PointOptionsObject, chart } from 'highcharts';
import { ResponseMessageHandlers } from 'src/app/Common/ResponseMessageHandlers';
import { FABRIC_PROCESS_RESOURCE_USAGE_EVENT_LIMIT, formatFabricProcessResourceBytes, IFabricProcessResourceUsageSample, parseFabricProcessResourceUsageEvent } from 'src/app/Models/eventstore/FabricProcessResourceUsage';
import { DataService } from 'src/app/services/data.service';
import { VisualizationComponent, VisUpdateData } from 'src/app/modules/event-store/visualizationComponents';
import { createFabricProcessResourceUsageChartOptions } from 'src/app/modules/event-store/fabric-process-resource-usage-chart';

@Component({
  selector: 'app-resource-usage-visualization',
  templateUrl: './resource-usage-visualization.component.html',
  styleUrls: ['./resource-usage-visualization.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class ResourceUsageVisualizationComponent implements VisualizationComponent, AfterViewInit, OnDestroy {
  private data = inject(DataService);

  @ViewChild('chartContainer') private chartContainer!: ElementRef;

  loading = false;
  failed = false;
  truncated = false;
  sampleCount = 0;

  private chart?: Chart;
  private loadSubscription?: Subscription;
  private isDestroyed = false;
  private samples: IFabricProcessResourceUsageSample[] = [];
  private startDate = new Date();
  private endDate = new Date();

  private readonly options = createFabricProcessResourceUsageChartOptions(
    [
      {
        name: 'CPU',
        type: 'line',
        color: '#4da3ff',
        data: []
      },
      {
        name: 'Memory',
        type: 'line',
        color: '#58b8a9',
        data: []
      }
    ],
    true
  );

  ngAfterViewInit(): void {
    this.chart = chart(this.chartContainer.nativeElement, this.options);
    this.renderChart();
  }

  update(data: VisUpdateData): void {
    if (this.isDestroyed) {
      return;
    }

    const nodeData = data.listEventStoreData.find(item => item.type === 'Node');
    if (!nodeData) {
      this.clear(false);
      return;
    }

    this.startDate = data.startDate;
    this.endDate = data.endDate;
    this.samples = [];
    this.sampleCount = 0;
    this.loading = true;
    this.failed = false;
    this.truncated = false;
    this.renderChart();
    this.loadSubscription?.unsubscribe();

    this.loadSubscription = this.data.restClient.getNodeEvents(
      this.startDate,
      this.endDate,
      nodeData.displayName,
      ['FabricProcessResourceUsage'],
      ResponseMessageHandlers.silentResponseMessageHandler
    ).subscribe({
      next: events => {
        this.samples = events
          .map(event => parseFabricProcessResourceUsageEvent(event, nodeData.displayName))
          .filter((sample): sample is IFabricProcessResourceUsageSample => sample !== undefined
            && sample.timestamp >= this.startDate
            && sample.timestamp <= this.endDate)
          .sort((left, right) => left.timestamp.getTime() - right.timestamp.getTime());
        this.sampleCount = this.samples.length;
        this.truncated = events.length >= FABRIC_PROCESS_RESOURCE_USAGE_EVENT_LIMIT;
        this.loading = false;
        this.renderChart();
      },
      error: () => this.clear(true)
    });
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    this.loadSubscription?.unsubscribe();
    this.chart?.destroy();
    this.chart = undefined;
  }

  private clear(failed: boolean): void {
    this.samples = [];
    this.sampleCount = 0;
    this.loading = false;
    this.failed = failed;
    this.truncated = false;
    this.renderChart();
  }

  private renderChart(): void {
    if (!this.chart) {
      return;
    }

    const cpuData: PointOptionsObject[] = this.samples.map(sample => ({
      x: sample.timestamp.getTime(),
      y: sample.cpuPercent,
      custom: { detail: '' }
    }));
    const memoryData: PointOptionsObject[] = this.samples.map(sample => ({
      x: sample.timestamp.getTime(),
      y: sample.memoryPercent,
      custom: { detail: ` (${formatFabricProcessResourceBytes(sample.memoryRssBytes)} of ${formatFabricProcessResourceBytes(sample.memoryTotalBytes)})` }
    }));

    this.chart.xAxis[0].setExtremes(this.startDate.getTime(), this.endDate.getTime(), false);
    this.chart.series[0].setData(cpuData, false);
    this.chart.series[1].setData(memoryData, false);
    this.chart.redraw();
  }

}