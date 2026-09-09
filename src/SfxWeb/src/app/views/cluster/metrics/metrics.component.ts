import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';
import { DataService } from 'src/app/services/data.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable, forkJoin, of } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { SettingsService } from 'src/app/services/settings.service';
import { ClusterLoadInformation } from 'src/app/Models/DataModels/Cluster';
import { NodeCollection } from 'src/app/Models/DataModels/collections/NodeCollection';
import { Node } from 'src/app/Models/DataModels/Node';
import { IMetricsViewModel, MetricsViewModel } from 'src/app/ViewModels/MetricsViewModel';
import { LoadMetricInformation } from 'src/app/Models/DataModels/Shared';
import { ExperienceService } from 'src/app/services/experience.service';

interface IChartSeries {
  label: string;
  data: (number | null)[];
}

interface IMetricsTableData {
  dataPoints: IChartSeries[];
  categories: string[];
  title: string;
  tooltipFunction: (() => any) | null;
}

@Component({
    selector: 'app-metrics',
    templateUrl: './metrics.component.html',
    styleUrls: ['./metrics.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class MetricsComponent extends BaseControllerDirective {
  experience = inject(ExperienceService);
  public metricSearch = '';
  public sidebarWidth = 420;
  private sidebarDrag?: { id: number; x: number; width: number };
  public resizeSidebar(event: PointerEvent, container: HTMLElement) {
    if (!this.sidebarDrag || event.pointerId !== this.sidebarDrag.id) { return; }
    this.sidebarWidth = Math.max(320, Math.min(680, container.clientWidth - 340, this.sidebarDrag.width + event.clientX - this.sidebarDrag.x));
  }
  public startSidebarResize(event: PointerEvent) {
    if (event.button !== 0) { return; }
    this.sidebarDrag = { id: event.pointerId, x: event.clientX, width: this.sidebarWidth };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    event.preventDefault();
  }
  public endSidebarResize(event: PointerEvent) {
    this.sidebarDrag = undefined;
    const handle = event.currentTarget as HTMLElement;
    if (handle.hasPointerCapture(event.pointerId)) { handle.releasePointerCapture(event.pointerId); }
    window.dispatchEvent(new Event('resize'));
  }
  public keyboardSidebarResize(event: KeyboardEvent, container: HTMLElement) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'Home') { return; }
    event.preventDefault();
    this.sidebarWidth = Math.max(320, Math.min(680, container.clientWidth - 340, event.key === 'Home' ? 420 : this.sidebarWidth + (event.key === 'ArrowRight' ? 20 : -20)));
    window.dispatchEvent(new Event('resize'));
  }
  public loadingMetrics = true;
  private initialSelectionDone = false;
  public get metricGroups() {
    if (!this.metricsViewModel) { return []; }
    return [
      { name: 'Resource capacity', metrics: this.metricsViewModel.metricsWithCapacities },
      { name: 'Load metrics', metrics: this.metricsViewModel.metricsWithoutCapacities },
      { name: 'System metrics', metrics: this.metricsViewModel.systemMetrics }
    ].map(group => ({ ...group, metrics: group.metrics.filter(metric => metric.displayName.toLowerCase().includes(this.metricSearch.toLowerCase())) }));
  }
  public get hasChartValues(): boolean { return this.tableData.dataPoints.some(series => series.data.some(value => value !== null)); }
  private data = inject(DataService);
  private settings = inject(SettingsService);


  clusterLoadInformation!: ClusterLoadInformation;
  nodes!: NodeCollection;
  metricsViewModel!: MetricsViewModel;
  tableData: IMetricsTableData = {
    dataPoints: [],
    categories: [],
    title: '',
    tooltipFunction: null
  };

  // groupByNodeType = false;
  showOptions = true;
  filteredNodes: Node[] = [];

  setup() {
    this.clusterLoadInformation = this.data.clusterLoadInformation;
    this.nodes = this.data.nodes;
  }

  updateSelectedMetric(metric: LoadMetricInformation, metricArray: LoadMetricInformation[]) {
    this.metricsViewModel.toggleMetric(metric, metricArray);
    this.updateViewMetric();
  }

  trackByMetric(index: number, metric: LoadMetricInformation): string {
    return metric.name;
  }

  updateViewMetric() {
    if (!this.metricsViewModel) { return; }
    this.tableData = {
      dataPoints: [],
      categories: [],
      title: 'Metrics',
      tooltipFunction: null
    };

    const chartMetricSeriesList: IChartSeries[] = this.metricsViewModel.selectedMetrics.map(metric => {
      return {
        label: metric.displayName,
        data: []
      };
    });

    //for some of the metrics, we normailize and show their value so its necessary to have both.
    let addNormalizationTooltip = false;
    const tooltipMap: Record<string, string> =  {};

    this.metricsViewModel.filteredNodeLoadInformation(this.filteredNodes).sort((a, b) => a.name.localeCompare(b.name)).forEach(metric => {
      this.metricsViewModel.selectedMetrics.forEach((selectedmetric, index) => {
        const normalize = selectedmetric.hasCapacity && this.metricsViewModel.normalizeMetricsData;
        const selectedNodeLoadMetricInfo = metric.nodeLoadMetricInformation.find(lmi => lmi.name === selectedmetric.name);
        if (!selectedNodeLoadMetricInfo) {
          chartMetricSeriesList[index].data.push(null);
          return;
        }
        let dataPoint = +selectedNodeLoadMetricInfo.raw.NodeLoad;

        if (normalize) {
          addNormalizationTooltip = true;
          dataPoint = selectedNodeLoadMetricInfo!.loadCapacityRatio;

          const d = selectedNodeLoadMetricInfo;
          const tooltip = `${d!.parent.name}: ${d!.raw.NodeLoad}${d!.hasCapacity ? ` / ${d!.raw.NodeCapacity} (${d!.loadCapacityRatioString})` : ""}`;
          tooltipMap[`${metric.raw.NodeName}-${selectedmetric.displayName}`] = tooltip;

        } else if (selectedmetric.hasCapacity) {
          dataPoint = Math.max(+selectedNodeLoadMetricInfo!.raw.NodeLoad, +selectedNodeLoadMetricInfo!.raw.NodeCapacity);
        }

          chartMetricSeriesList[index].data.push(Number.isFinite(dataPoint) ? dataPoint : null);

      });

        this.tableData.categories.push(metric.raw.NodeName);
    });

    if (addNormalizationTooltip) {
      this.tableData.tooltipFunction = function(this: { x: string | number; series: { name: string } }) {
        return tooltipMap[`${this.x}-${this.series.name}`]
      }
    }

    this.tableData.dataPoints = chartMetricSeriesList;
  }

  public toggleSide() {
    this.showOptions = !this.showOptions;
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 10)
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    this.loadingMetrics = true;
    return forkJoin([
      this.nodes.refresh(messageHandler),
      this.clusterLoadInformation.refresh(messageHandler)
    ]).pipe(mergeMap(() => {
      if (!this.metricsViewModel) {
        this.metricsViewModel = this.settings.getNewOrExistingMetricsViewModel(this.clusterLoadInformation);
      }

      const promises = this.nodes.collection.map(node => node.loadInformation.refresh(messageHandler));
      return (promises.length ? forkJoin(promises) : of([])).pipe(map(() => {
        this.metricsViewModel.refresh();
        if (this.experience.isNew() && !this.initialSelectionDone) {
          if (!this.metricsViewModel.selectedMetrics.length) {
            const available = this.metricsViewModel.metrics.filter(metric => this.nodes.collection.some(node =>
              node.loadInformation.isInitialized && node.loadInformation.nodeLoadMetricInformation.some(item => item.name === metric.name)));
            const metric = available.find(item => item.name === 'Count') || available.find(item => !item.hasCapacity) || available[0];
            if (metric) { metric.selected = true; }
          }
          this.initialSelectionDone = true;
        }
        this.loadingMetrics = false;
        this.updateViewMetric();
      }));
    }));
  }

  setNodes(nodes: Node[]) {
    this.filteredNodes = nodes;
    this.updateViewMetric();
  }
}
