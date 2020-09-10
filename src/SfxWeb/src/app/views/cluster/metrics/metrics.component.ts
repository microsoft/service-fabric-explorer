import { Component, OnInit, Injector } from '@angular/core';
import { BaseController } from 'src/app/ViewModels/BaseController';
import { DataService } from 'src/app/services/data.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable, forkJoin } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { SettingsService } from 'src/app/services/settings.service';
import { ClusterLoadInformation } from 'src/app/Models/DataModels/Cluster';
import { NodeCollection } from 'src/app/Models/DataModels/collections/NodeCollection';
import { IMetricsViewModel, MetricsViewModel } from 'src/app/ViewModels/MetricsViewModel';
import { LoadMetricInformation } from 'src/app/Models/DataModels/Shared';

interface IChartData {
  dataPoints: number[];
  categories: string[];
  title: string;
  subtitle: string;
}

@Component({
  selector: 'app-metrics',
  templateUrl: './metrics.component.html',
  styleUrls: ['./metrics.component.scss']
})
export class MetricsComponent extends BaseController {

  clusterLoadInformation: ClusterLoadInformation;
  nodes: NodeCollection;
  metricsViewModel: MetricsViewModel;
  tableData: IChartData = {
    dataPoints: [],
    categories: [],
    title: '',
    subtitle: ''
  };
  constructor(private data: DataService, private settings: SettingsService, injector: Injector) {
    super(injector);
   }

  setup(){
    this.clusterLoadInformation = this.data.clusterLoadInformation;
    this.nodes = this.data.nodes;
  }

  updateSelectedMetric(metric: LoadMetricInformation) {
    this.metricsViewModel.toggleMetric(metric);
    this.updateViewMetric();
  }

  updateViewMetric() {
    this.tableData = {
      dataPoints: [],
      categories: [],
      title: this.metricsViewModel.selectedMetrics[0].displayName,
      subtitle: ''
    };

    this.metricsViewModel.filteredNodeLoadInformation.forEach(metric => {
      this.tableData.dataPoints.push(metric.metrics[this.metricsViewModel.selectedMetrics[0].name]);
      this.tableData.categories.push(metric.raw.NodeName);
    });

  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    return forkJoin([
        this.nodes.refresh(messageHandler),
        this.clusterLoadInformation.refresh(messageHandler)
      ]).pipe(mergeMap( () => {
          if (!this.metricsViewModel) {
              this.metricsViewModel = this.settings.getNewOrExistingMetricsViewModel(this.clusterLoadInformation, this.nodes.collection.map(node => node.loadInformation));
          }

          const promises = this.nodes.collection.map(node => node.loadInformation.refresh(messageHandler));
          return forkJoin(promises).pipe(map(() => {
              this.metricsViewModel.refresh();
              this.updateViewMetric();
            }));
      }));
  }
}
