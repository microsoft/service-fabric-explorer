import { Component, OnInit } from '@angular/core';
import { IParallelChartData } from 'src/app/modules/concurrent-events-visualization/timeseries/timeseries.component';
import { DataService } from 'src/app/services/data.service';
import { Observable, forkJoin } from 'rxjs';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { IOnDateChange } from 'src/app/modules/time-picker/double-slider/double-slider.component';
import { data } from './test';
import { Utils } from 'src/app/Utils/Utils';
import { Service } from 'src/app/Models/DataModels/Service';
import { IEventStoreData } from 'src/app/modules/event-store/event-store/event-store.component';
import { ReplicaEventList } from 'src/app/Models/DataModels/collections/Collections';
import { ReplicaEvent } from 'src/app/Models/eventstore/Events';

const rdata = data.map(item => {
  return {
    ...item,
    TimeStamp: new Date(item.TimeStamp)
  }
}).sort((a,b) => a.TimeStamp.getTime() - b.TimeStamp.getTime())

const splitData = Utils.groupByFunc(rdata.filter(item => item.Kind === "NamingMetricsReported"), item => item.OperationName);
console.log(splitData)

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
export class NamingViewerComponent implements OnInit {
  public startDate: Date;
  public endDate: Date;
  public startDateMin: Date;
  public startDateMax: Date;

  dataset: IParallelChartData = {
    dataSets: [],
    series: [
      {
        name: 'Average Latency',
        xProperty: 'time',
        yProperty: 'eventProperties.AverageLatency',
        yUnits: 'MS',
        yLabel: 'Latency'
      },
      {
        name: 'Average Response Size',
        xProperty: 'time',
        yProperty: 'eventProperties.AverageResponseSize',
        yUnits: 'Bytes',
        yLabel: 'Size'
      },
      {
        name: 'Request Volume',
        xProperty: 'time',
        yProperty: 'eventProperties.RequestCount',
        yLabel: 'Count'
      }
    ]
  }

  overviewPanels: IOverviewPanel[] = []

  public namingService: Service;

  constructor(private dataService: DataService) { }

  ngOnInit(): void {
    const todaysDate = new Date();
    this.startDate = TimeUtils.AddDays(todaysDate, -7);
    this.endDate = this.startDateMax = todaysDate;
    this.startDateMin = TimeUtils.AddDays(todaysDate, -30);
    console.log(this.dataset)
    this.dataService.getService("System", "System/NamingService").subscribe(app => {
      const ess: IEventStoreData<ReplicaEventList, ReplicaEvent>[] = [];
      this.namingService = app;
      app.partitions.ensureInitialized().subscribe(_ => {
        forkJoin(app.partitions.collection.map(partition => {
          const es = this.dataService.getReplicaEventData(partition.id);
          ess.push(es);
          return es.eventsList.refresh();
        })).subscribe(() => {
          let dataSets = [];

          this.overviewPanels = this.namingService.partitions.collection.map((partition, index) => {

            const splitData = Utils.groupByFunc(ess[index].getEvents().filter(item => item.kind === "NamingMetricsReported"), item => item.eventProperties.OperationName);

            dataSets = dataSets.concat(Object.keys(splitData).map(key => {
              return {
                name: partition.id +  key,
                values: splitData[key]
              }
            }));

            return {
              name: partition.id,
              displayContent: () => "Volume: 100",
              toggled: true,
              nestedOptions: Object.entries(splitData).map(d => {
                return {
                  toggled: true,
                  name: d[0]
                }
              })
            }
          })
          console.log(this.overviewPanels)
          this.dataset = {
            ...this.dataset,
            dataSets
          }
          console.log(this.dataset)
        })
      })
    })
  }

  setNewDates(dates: IOnDateChange) {
    this.startDate = dates.startDate;
    this.endDate = dates.endDate;
    // this.setNewDateWindow();
  }
}
