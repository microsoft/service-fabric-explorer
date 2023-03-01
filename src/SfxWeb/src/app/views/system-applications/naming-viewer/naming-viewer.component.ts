import { Component, OnInit } from '@angular/core';
import { IParallelChartData } from 'src/app/modules/concurrent-events-visualization/timeseries/timeseries.component';
import { DataService } from 'src/app/services/data.service';
import { Observable, forkJoin } from 'rxjs';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { IOnDateChange } from 'src/app/modules/time-picker/double-slider/double-slider.component';
import { data } from './test';
import { Utils } from 'src/app/Utils/Utils';
import { Service } from 'src/app/Models/DataModels/Service';

const rdata = data.map(item => {
  return {
    ...item,
    TimeStamp: new Date(item.TimeStamp)
  }
}).sort((a,b) => a.TimeStamp.getTime() - b.TimeStamp.getTime())

const splitData = Utils.groupByFunc(rdata.filter(item => item.Kind === "NamingMetricsReported"), item => item.OperationName);
console.log(splitData)
// data.forEach(item => {
//   // item.OperationName
//   Utils.groupBy(data, 'OperationName')
// })

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
    dataSets: Object.keys(splitData).map(key => {
      return {
        name: key,
        values: splitData[key]
      }
    }),

    series: [
      {
        name: 'Average Latency',
        xProperty: 'TimeStamp',
        yProperty: 'AverageLatency',
        yUnits: 'MS',
        yLabel: 'Latency'
      },
      {
        name: 'Average Response Size',
        xProperty: 'TimeStamp',
        yProperty: 'AverageResponseSize',
        yUnits: 'Bytes',
        yLabel: 'Size'
      },
      {
        name: 'Request Volume',
        xProperty: 'TimeStamp',
        yProperty: 'RequestCount',
        yLabel: 'Count'
      }
    ]
  }

  public namingService: Service;

  constructor(private dataService: DataService) { }

  ngOnInit(): void {
    const todaysDate = new Date();
    this.startDate = TimeUtils.AddDays(todaysDate, -7);
    this.endDate = this.startDateMax = todaysDate;
    this.startDateMin = TimeUtils.AddDays(todaysDate, -30);
    console.log(this.dataset)
    this.dataService.getService("System", "System/NamingService").subscribe(app => {
      const ess = [];
      this.namingService = app;
      app.partitions.ensureInitialized().subscribe(_ => {
        forkJoin(app.partitions.collection.map(partition => {
          const es = this.dataService.getReplicaEventData(partition.id);
          ess.push(es);
          return es.eventsList.refresh();
        })).subscribe(() => {
          console.log(ess)
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
