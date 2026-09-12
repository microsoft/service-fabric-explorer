import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { IDataSet, IParallelChartData } from 'src/app/modules/concurrent-events-visualization/timeseries/timeseries.component';
import { Utils } from 'src/app/Utils/Utils';
import { ReplicaEvent } from 'src/app/Models/eventstore/Events';
import { VisualizationComponent, VisUpdateData } from 'src/app/modules/event-store/visualizationComponents';
import { SettingsService } from 'src/app/services/settings.service';
import { ListColumnSetting, ListColumnSettingWithEventStoreFullDescription, ListColumnSettingWithUtcTime } from 'src/app/Models/ListSettings';
import { ExperienceService } from 'src/app/services/experience.service';

export interface INestedDataSetOption {
  name: string;
  toggled: boolean;
  options?: INestedDataSetOption[];
}

export interface IOverviewPanel {
  sourceName: string;
  name: string;
  displayContent: string;
  requestCount: number;
  reportCount: number;
  toggled: boolean;
  nestedOptions: INestedDataSetOption[];
}

@Component({
    selector: 'app-naming-viewer',
    templateUrl: './naming-viewer.component.html',
    styleUrls: ['./naming-viewer.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class NamingViewerComponent implements VisualizationComponent {
  experience = inject(ExperienceService);
  public hasLoaded = false;
  public failedSources = false;
  private settings = inject(SettingsService);

  public startDate!: Date;
  public endDate!: Date;
  public startDateMin!: Date;
  public startDateMax!: Date;

  dataset: IParallelChartData = {
    dataSets: [],
    series: [
      {
        name: 'Average Latency',
        xProperty: 'raw.time',
        yProperty: 'raw.eventProperties.AverageLatency',
        yUnits: 'MS',
        yLabel: 'Latency'
      },
      {
        name: 'Average Response Size',
        xProperty: 'raw.time',
        yProperty: 'raw.eventProperties.AverageResponseSize',
        yUnits: 'Bytes',
        yLabel: 'Size'
      },
      {
        name: 'Request Volume',
        xProperty: 'raw.time',
        yProperty: 'raw.eventProperties.RequestCount',
        yLabel: 'Count'
      }
    ],
    listSettings: null!
  }

  overviewPanels: IOverviewPanel[] = []
  localData!: VisUpdateData;
  public get selectedReportCount(): number { return this.dataset.dataSets.reduce((count, data) => count + data.values.length, 0); }
  public get hasSingleSampleSeries(): boolean { return this.dataset.dataSets.some(data => data.values.length === 1); }
  public partitionSearch = '';
  public operationSearch = '';
  public get selectedPartitionCount() { return this.overviewPanels.filter(panel => panel.toggled).length; }
  public get visiblePartitions() { return this.overviewPanels.filter(panel => panel.sourceName.toLowerCase().includes(this.partitionSearch.trim().toLowerCase())); }
  public get operationPanels() {
    const query = this.operationSearch.trim().toLowerCase();
    return this.overviewPanels.filter(panel => panel.toggled).map(panel => ({ panel, options: panel.nestedOptions.filter(option => option.name.toLowerCase().includes(query)) })).filter(group => group.options.length);
  }
  public togglePartitions(state: boolean) { this.overviewPanels.forEach(panel => panel.toggled = state); this.updateData(); }
  public toggleOperations(state: boolean) {
    this.overviewPanels.filter(panel => panel.toggled).forEach(panel => panel.nestedOptions.forEach(option => option.toggled = state));
    this.updateData();
  }

  public showAllMetrics() {
    this.overviewPanels.forEach(panel => { panel.toggled = true; panel.nestedOptions.forEach(option => option.toggled = true); });
    this.updateData();
  }

  generateOverviewPanel(data: VisUpdateData) {
    const previousOverviewPanels = this.overviewPanels;
    this.overviewPanels = [];
    data.listEventStoreData.forEach(partition => {
      const splitData = this.splitData(partition.eventsList.collection);
      let volume = 0;

      Object.entries(splitData).forEach(entry => {
        entry[1].forEach(event => {
          volume += Number(event.raw.eventProperties.RequestCount) || 0;
        })
      })
      if(Object.keys(splitData).length) {
        const name = partition.displayName.slice(32, 37);
        const previousPanelState = previousOverviewPanels.find(panel => panel.sourceName === partition.displayName);

        let toggled = true;
        const nestedOptions = Object.entries(splitData).map(d => {
          return {
            toggled: true,
            name: d[0]
          }
        });

        if(previousPanelState) {
          toggled = previousPanelState.toggled;
          nestedOptions.forEach(option => {
            const previousNestedOption = previousPanelState.nestedOptions.find(nested => nested.name === option.name);
            if(previousNestedOption) {
              option.toggled = previousNestedOption.toggled;
            }
          })
        }

        this.overviewPanels.push({
          sourceName: partition.displayName,
          name,
          displayContent: `Total Volume: ${volume}`,
          requestCount: volume,
          reportCount: Object.values(splitData).reduce((count, reports) => count + reports.length, 0),
          toggled,
          nestedOptions
        })
      }
    })
  }

  updateData() {
    const listSettings = this.settings.getNewOrExistingListSettings("naming", ['raw.TimeStamp'],
    [
      new ListColumnSetting('raw.eventProperties.AverageLatency', 'Average Latency'),
      new ListColumnSetting('raw.eventProperties.AverageResponseSize', 'Average Response Size'),
      new ListColumnSetting('raw.eventProperties.RequestCount', 'Request Count'),
      new ListColumnSettingWithUtcTime('raw.timeStamp', 'Time Stamp'),
      new ListColumnSetting('raw.eventProperties.NodeId1', 'Node 1'),
      new ListColumnSetting('raw.eventProperties.NodeId2', 'Node 2'),
      new ListColumnSetting('raw.eventProperties.NodeId3', 'Node 3'),

    ],
    [
      new ListColumnSettingWithEventStoreFullDescription(),
    ],
    true);
    let dataSets: IDataSet[] = [];
    this.overviewPanels.forEach(panel => {
      const source = this.localData.listEventStoreData.find(item => item.displayName === panel.sourceName);
      if (source) { dataSets = dataSets.concat(this.sortAndFilterData(panel, source.eventsList.collection)); }
    })

    this.dataset = {
      ...this.dataset,
      dataSets,
      listSettings
    }
  }

  bulkToggleStateChange(panel: IOverviewPanel, state: boolean) {
    panel.nestedOptions.forEach(option => {
      option.toggled = state;
    })

    this.updateData();
  }

  splitData(events: ReplicaEvent[]) {
    return Utils.groupByFunc(events.filter(item => item.raw.kind === "NamingMetricsReported").sort((a,b) => a.raw.time.getTime() - b.raw.time.getTime()), item => item.raw.eventProperties.OperationName);
  }

  sortAndFilterData(overview: IOverviewPanel, events: ReplicaEvent[]): IDataSet[] {
    const filteredEvents: IDataSet[] = [];
    const splitData = this.splitData(events);

    if (overview.toggled) {
      overview.nestedOptions.forEach(option => {
        if (option.toggled && option.name in splitData) {
          filteredEvents.push({
            name: this.experience.isNew() ? overview.sourceName + ' · ' + option.name : overview.name + ' ' + option.name,
            values: splitData[option.name]
          })
        }
      })
    }

    return filteredEvents;
  }

  getToggled(options: INestedDataSetOption[]) {
    return options.filter(option => option.toggled).length;
  }

  update(data: VisUpdateData) {
    this.hasLoaded = true;
    this.failedSources = data.listEventStoreData.some(source => source.eventsList.lastRefreshWasSuccessful === false);
    this.generateOverviewPanel(data);
    this.localData = data;
    this.updateData();
  }
}
