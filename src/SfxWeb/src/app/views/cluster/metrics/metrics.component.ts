import { Component, OnInit, Injector } from '@angular/core';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';
import { DataService } from 'src/app/services/data.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable, forkJoin } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { SettingsService } from 'src/app/services/settings.service';
import { ClusterLoadInformation } from 'src/app/Models/DataModels/Cluster';
import { NodeCollection } from 'src/app/Models/DataModels/collections/NodeCollection';
import { IMetricsViewModel, MetricsViewModel } from 'src/app/ViewModels/MetricsViewModel';
import { LoadMetricInformation } from 'src/app/Models/DataModels/Shared';

interface IChartSeries {
  label: string;
  data: number[];
}

@Component({
  selector: 'app-metrics',
  templateUrl: './metrics.component.html',
  styleUrls: ['./metrics.component.scss']
})
export class MetricsComponent extends BaseControllerDirective {

  clusterLoadInformation: ClusterLoadInformation;
  nodes: NodeCollection;
  metricsViewModel: MetricsViewModel;
  tableData = {
    dataPoints: [],
    categories: [],
    title: '',
  };

  groupByNodeType = false;
  showOptions = true;
  filteredNodes = [];

  constructor(private data: DataService, private settings: SettingsService, injector: Injector) {
    super(injector);
  }

  setup() {
    this.clusterLoadInformation = this.data.clusterLoadInformation;
    this.nodes = this.data.nodes;
  }

  updateSelectedMetric(metric: LoadMetricInformation, metricArray: LoadMetricInformation[]) {
    this.metricsViewModel.toggleMetric(metric, metricArray);
    this.updateViewMetric();
  }

  updateViewMetric() {
    this.tableData = {
      dataPoints: [],
      categories: [],
      title: 'Metrics',
    };

    const chartMetricSeriesList: IChartSeries[] = this.metricsViewModel.selectedMetrics.map(metric => {
      return {
        label: metric.displayName,
        data: []
      };
    });

    //when grouping by node type keep track of each group to add them at the end
    const nodeTypeMap = {};

    if (this.groupByNodeType) {
      this.nodes.nodeTypes.forEach(nodeType => {
        nodeTypeMap[nodeType] = this.metricsViewModel.selectedMetrics.map(() => 0);
      });
    }

    //for some of the metrics, we normailize and show their value so its necessary to have both.
    let addNormalizationTooltip = false;
    const tooltipMap =  {};

    this.metricsViewModel.filteredNodeLoadInformation(this.filteredNodes).sort((a, b) => a.name.localeCompare(b.name)).forEach(metric => {
      this.metricsViewModel.selectedMetrics.forEach((selectedmetric, index) => {
        const normalize = selectedmetric.hasCapacity && this.metricsViewModel.normalizeMetricsData;
        const selectedNodeLoadMetricInfo = metric.nodeLoadMetricInformation.find(lmi => lmi.name === selectedmetric.name);
        let dataPoint = +selectedNodeLoadMetricInfo.raw.NodeLoad;

        if (normalize) {
          addNormalizationTooltip = true;
          dataPoint = selectedNodeLoadMetricInfo.loadCapacityRatio;

          const d = selectedNodeLoadMetricInfo;
          const tooltip = `${d.parent.name}: ${d.raw.NodeLoad}${d.hasCapacity ? ` / ${d.raw.NodeCapacity} (${d.loadCapacityRatioString})` : ""}`;
          tooltipMap[`${selectedmetric}`]

        } else if (selectedmetric.hasCapacity) {
          dataPoint = Math.max(+selectedNodeLoadMetricInfo.raw.NodeLoad, +selectedNodeLoadMetricInfo.raw.NodeCapacity);
        }

        //when grouping by nodetype wait to the end to add them to the chartMetricSeries otherwise can push them directly
        if (this.groupByNodeType) {
          nodeTypeMap[metric.parent.raw.Type][index] += dataPoint;
        } else {
          chartMetricSeriesList[index].data.push(dataPoint);
        }
      });

      if (!this.groupByNodeType) {
        this.tableData.categories.push(metric.raw.NodeName);
      }
    });


    if (this.groupByNodeType) {
      this.tableData.categories = Object.keys(nodeTypeMap);

      //add each selected metric for each node type.
      this.metricsViewModel.selectedMetrics.forEach((_, index) => {
        Object.keys(nodeTypeMap).forEach(key => {
          chartMetricSeriesList[index].data.push(nodeTypeMap[key][index]);
        });
      });
    }

    if (addNormalizationTooltip) {

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
    return forkJoin([
      this.nodes.refresh(messageHandler),
      this.clusterLoadInformation.refresh(messageHandler)
    ]).pipe(mergeMap(() => {
      if (!this.metricsViewModel) {
        this.metricsViewModel = this.settings.getNewOrExistingMetricsViewModel(this.clusterLoadInformation);
      }

      const promises = this.nodes.collection.map(node => node.loadInformation.refresh(messageHandler));
      return forkJoin(promises).pipe(map(() => {
        this.metricsViewModel.refresh();
        this.updateViewMetric();
      }));
    }));
  }

  setNodes(nodes: Node[]) {
    this.filteredNodes = nodes;
    this.updateViewMetric();
  }
}
