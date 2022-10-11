import { Component, OnInit } from '@angular/core';
import { IParallelChartData } from 'src/app/modules/concurrent-events-visualization/timeseries/timeseries.component';
import { DataService } from 'src/app/services/data.service';
import { Observable, forkJoin } from 'rxjs';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { IOnDateChange } from 'src/app/modules/time-picker/double-slider/double-slider.component';

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
    dataSet: [
      {
        x: 0,
        y: 1
      },
      {
        x: 2,
        y: 2
      },
      {
        x: 3,
        y: 3
      }
    ],
    series: [
      {
        name: 'Average Latency',
        xProperty: 'x',
        yProperty: 'y'
      },
      {
        name: 'Request Volume',
        xProperty: 'x',
        yProperty: 'y'
      },
      {
        name: 'Request Volume',
        xProperty: 'x',
        yProperty: 'y'
      }
    ]
  }

  constructor(private dataService: DataService) { }

  ngOnInit(): void {
    const todaysDate = new Date();
    this.startDate = TimeUtils.AddDays(todaysDate, -7);
    this.endDate = this.startDateMax = todaysDate;
    this.startDateMin = TimeUtils.AddDays(todaysDate, -30);

    this.dataService.getService("System", "System/NamingService").subscribe(app => {
      const ess = [];
      app.partitions.ensureInitialized().subscribe(_ => {
        forkJoin(app.partitions.collection.map(partition => {
          const es = this.dataService.getPartitionEventData(partition.id);
          ess.push(es);
          return es.eventsList.refresh();
        })).subscribe(() => {
          console.log(ess.map(e => e.collection))
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
