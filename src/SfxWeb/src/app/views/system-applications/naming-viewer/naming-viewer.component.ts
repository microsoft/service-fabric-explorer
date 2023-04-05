import { Component, OnInit } from '@angular/core';
import { IDataSet, IParallelChartData } from 'src/app/modules/concurrent-events-visualization/timeseries/timeseries.component';
import { Utils } from 'src/app/Utils/Utils';
import { ReplicaEvent } from 'src/app/Models/eventstore/Events';
import { VisualizationComponent, VisUpdateData } from 'src/app/modules/event-store/visualizationComponents';
import { SettingsService } from 'src/app/services/settings.service';
import { ListColumnSetting, ListColumnSettingWithEventStoreFullDescription, ListColumnSettingWithUtcTime } from 'src/app/Models/ListSettings';

export interface INestedDataSetOption {
  name: string;
  toggled: boolean;
  options?: INestedDataSetOption[];
}

export interface IOverviewPanel {
  name: string;
  displayContent: () => string;
  toggled: boolean;
  nestedOptions: INestedDataSetOption[];
}

@Component({
  selector: 'app-naming-viewer',
  templateUrl: './naming-viewer.component.html',
  styleUrls: ['./naming-viewer.component.scss']
})
export class NamingViewerComponent implements VisualizationComponent {
  public startDate: Date;
  public endDate: Date;
  public startDateMin: Date;
  public startDateMax: Date;

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
    listSettings: null
  }

  overviewPanels: IOverviewPanel[] = []
  localData: VisUpdateData;

  constructor(private settings: SettingsService) {}

  generateOverviewPanel(data: VisUpdateData) {
    const previousOverviewPanels = this.overviewPanels;
    this.overviewPanels = [];
    data.listEventStoreData.forEach((partition, index) => {
      const splitData = this.splitData(partition.eventsList.collection);
      let volume = 0;

      Object.entries(splitData).forEach(entry => {
        entry[1].forEach(event => {
          volume += event.raw.eventProperties.RequestCount;
        })
      })
      if(Object.keys(splitData).length) {
        const name = partition.displayName.slice(32, 37);
        const previousPanelState = previousOverviewPanels.find(panel => panel.name === name);

        let toggled = true;
        const nestedOptions = Object.entries(splitData).map(d => {
          return {
            toggled: true,
            name: d[0]
          }
        });

        if(previousPanelState) {
          console.log(previousPanelState)
          toggled = previousPanelState.toggled;
          nestedOptions.forEach(option => {
            const previousNestedOption = previousPanelState.nestedOptions.find(nested => nested.name === option.name);
            if(previousNestedOption) {
              option.toggled = previousNestedOption.toggled;
            }
          })
        }

        this.overviewPanels.push({
          name,
          displayContent: () => `Total Volume: ${volume}`,
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
      new ListColumnSetting('raw.eventProperties.AverageLatency', 'Average Latency'),
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
    this.overviewPanels.forEach((panel, index) => {

      dataSets = dataSets.concat(this.sortAndFilterData(panel, this.localData.listEventStoreData[index].eventsList.collection));
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
    const data = Utils.groupByFunc(events.filter(item => item.raw.kind === "NamingMetricsReported").sort((a,b) => a.raw.time.getTime() - b.raw.time.getTime()), item => item.raw.eventProperties.OperationName);
    Object.keys(data).forEach(dataset => {
      const events = data[dataset];

      if(events.length === 1) {
        const middleEvent = events[0];
        // const firstEvent = structuredClone(middleEvent);
        // const lastEvent = structuredClone(middleEvent);
        console.log(middleEvent)
      }
    })
    return data;
  }

  sortAndFilterData(overview: IOverviewPanel, events: ReplicaEvent[]): IDataSet[] {
    const filteredEvents: IDataSet[] = [];
    const splitData = this.splitData(events);

    if (overview.toggled) {
      overview.nestedOptions.forEach(option => {
        if (option.toggled && option.name in splitData) {
          filteredEvents.push({
            name: overview.name + " " + option.name,
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
    console.log(data, this);
    this.generateOverviewPanel(data);
    this.localData = data;
    this.updateData();
  }
}
