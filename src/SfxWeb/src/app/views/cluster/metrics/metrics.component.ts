// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

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
    tooltipFunction: null
  };

  // groupByNodeType = false;
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
          tooltipMap[`${metric.raw.NodeName}-${selectedmetric.displayName}`] = tooltip;

        } else if (selectedmetric.hasCapacity) {
          dataPoint = Math.max(+selectedNodeLoadMetricInfo.raw.NodeLoad, +selectedNodeLoadMetricInfo.raw.NodeCapacity);
        }

          chartMetricSeriesList[index].data.push(dataPoint);

      });

        this.tableData.categories.push(metric.raw.NodeName);
    });

    if (addNormalizationTooltip) {
      this.tableData.tooltipFunction = function() {
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
